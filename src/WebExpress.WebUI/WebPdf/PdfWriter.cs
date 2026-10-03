using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Writes a laid-out document in the PDF file format (ISO 32000, version 1.4 features).
    /// <para>
    /// The file is assembled from numbered objects - the catalog, the page tree, one object
    /// per page and per content stream, the fonts, the images and the bookmarks - followed by
    /// the cross-reference table that tells a reader where each object starts. Fonts are
    /// referenced by name only, since the standard fonts are built into every reader.
    /// </para>
    /// </summary>
    internal static class PdfWriter
    {
        /// <summary>
        /// Lays out a document and writes it to a stream.
        /// </summary>
        /// <param name="document">The document.</param>
        /// <param name="stream">The stream to write to.</param>
        public static void Write(PdfDocument document, Stream stream)
        {
            var layout = new PdfLayout(document);
            layout.Run();

            var file = new FileBuilder();
            var catalog = file.Reserve();
            var pageTree = file.Reserve();
            var info = file.Reserve();
            var resources = file.Reserve();
            var fonts = layout.UsedResources.Fonts.ToDictionary(f => f, _ => file.Reserve());
            var images = layout.UsedResources.Images.ToList();
            var imageObjects = images.ToDictionary(i => i.Key, _ => file.Reserve());
            var maskObjects = images.Where(i => i.Key.SoftMask is not null).ToDictionary(i => i.Key, _ => file.Reserve());
            var pages = layout.Pages.Select(_ => (Page: file.Reserve(), Content: file.Reserve())).ToList();
            var outline = document.Outline && layout.Outline.Count > 0 ? file.Reserve() : 0;

            file.Header();

            file.Object(catalog, "<< /Type /Catalog /Pages " + Ref(pageTree)
                + (outline > 0 ? " /Outlines " + Ref(outline) + " /PageMode /UseOutlines" : "")
                + (string.IsNullOrWhiteSpace(document.Language) ? "" : " /Lang " + Text(document.Language.Trim()))
                + " >>");

            file.Object(pageTree, $"<< /Type /Pages /Kids [{string.Join(" ", pages.Select(p => Ref(p.Page)))}] /Count {pages.Count} >>");

            file.Object(info, Info(document));

            file.Object(resources, "<< /ProcSet [/PDF /Text /ImageB /ImageC /ImageI]"
                + (fonts.Count > 0 ? " /Font << " + string.Join(" ", fonts.Select(f => $"/F{(int)f.Key + 1} {Ref(f.Value)}")) + " >>" : "")
                + (images.Count > 0 ? " /XObject << " + string.Join(" ", images.Select(i => $"/{i.Value} {Ref(imageObjects[i.Key])}")) + " >>" : "")
                + " >>");

            foreach (var (face, number) in fonts)
            {
                file.Object(number, $"<< /Type /Font /Subtype /Type1 /BaseFont /{PdfFont.BaseFont(face)} /Encoding /WinAnsiEncoding >>");
            }

            foreach (var (image, _) in images)
            {
                file.Image(imageObjects[image], image, maskObjects.TryGetValue(image, out var mask) ? mask : 0);

                if (mask > 0)
                {
                    file.Image(mask, image.SoftMask, 0);
                }
            }

            var size = document.PageSize;

            for (var i = 0; i < pages.Count; i++)
            {
                var page = layout.Pages[i];
                var annotations = page.Links.Select(l =>
                    $"<< /Type /Annot /Subtype /Link /Rect [{PdfLayout.F(l.X)} {PdfLayout.F(l.Y)} {PdfLayout.F(l.X + l.Width)} {PdfLayout.F(l.Y + l.Height)}]"
                    + $" /Border [0 0 0] /A << /S /URI /URI ({PdfLayout.Escape(new Uri(l.Uri).AbsoluteUri)}) >> >>");

                file.Object(pages[i].Page, $"<< /Type /Page /Parent {Ref(pageTree)} /MediaBox [0 0 {PdfLayout.F(size.Width)} {PdfLayout.F(size.Height)}]"
                    + $" /Resources {Ref(resources)} /Contents {Ref(pages[i].Content)}"
                    + (page.Links.Count > 0 ? $" /Annots [{string.Join(" ", annotations)}]" : "")
                    + " >>");

                var content = Encoding.Latin1.GetBytes($"q\n{page.Background}Q\nq\n{page.Foreground}Q\n");
                file.Stream(pages[i].Content, "", content, document.Compress);
            }

            if (outline > 0)
            {
                WriteOutline(file, outline, layout.Outline, pages.Select(p => p.Page).ToList());
            }

            file.Finish(catalog, info, stream);
        }

        /// <summary>
        /// Compresses data with the zlib format the FlateDecode filter reads.
        /// </summary>
        /// <param name="data">The data.</param>
        /// <returns>The compressed data.</returns>
        internal static byte[] Deflate(byte[] data)
        {
            using var output = new MemoryStream();

            using (var zlib = new ZLibStream(output, CompressionLevel.Optimal, true))
            {
                zlib.Write(data, 0, data.Length);
            }

            return output.ToArray();
        }

        /// <summary>
        /// Returns the document information dictionary.
        /// </summary>
        /// <param name="document">The document.</param>
        /// <returns>The dictionary.</returns>
        private static string Info(PdfDocument document)
        {
            var entries = new List<string>();

            void Add(string key, string value)
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    entries.Add($"/{key} {Text(value.Trim())}");
                }
            }

            Add("Title", document.Title);
            Add("Author", document.Author);
            Add("Subject", document.Subject);
            Add("Keywords", document.Keywords);
            Add("Creator", "WebExpress");
            Add("Producer", "WebExpress.WebUI");

            var date = document.CreationDate ?? DateTimeOffset.Now;
            var offset = date.Offset;
            var sign = offset < TimeSpan.Zero ? "-" : "+";

            entries.Add($"/CreationDate (D:{date:yyyyMMddHHmmss}{sign}{Math.Abs(offset.Hours):00}'{Math.Abs(offset.Minutes):00}')");

            return $"<< {string.Join(" ", entries)} >>";
        }

        /// <summary>
        /// Writes the bookmarks. The flat sequence of headings becomes a tree by level: a
        /// heading is the child of the closest preceding heading of a smaller level, so a
        /// document that skips a level still nests sensibly.
        /// </summary>
        /// <param name="file">The file.</param>
        /// <param name="root">The number of the outline root.</param>
        /// <param name="entries">The headings in document order.</param>
        /// <param name="pages">The numbers of the page objects.</param>
        private static void WriteOutline(FileBuilder file, int root, IReadOnlyList<PdfLayout.OutlineEntry> entries, List<int> pages)
        {
            var nodes = entries.Select(e => new OutlineNode(e, file.Reserve())).ToList();
            var top = new List<OutlineNode>();
            var stack = new Stack<OutlineNode>();

            foreach (var node in nodes)
            {
                while (stack.Count > 0 && stack.Peek().Entry.Level >= node.Entry.Level)
                {
                    stack.Pop();
                }

                if (stack.Count > 0)
                {
                    node.Parent = stack.Peek();
                    node.Parent.Children.Add(node);
                }
                else
                {
                    top.Add(node);
                }

                stack.Push(node);
            }

            file.Object(root, $"<< /Type /Outlines /First {Ref(top[0].Number)} /Last {Ref(top[^1].Number)} /Count {nodes.Count} >>");

            foreach (var node in nodes)
            {
                var siblings = node.Parent?.Children ?? top;
                var index = siblings.IndexOf(node);
                var builder = new StringBuilder();

                builder.Append($"<< /Title {Text(node.Entry.Title)} /Parent {Ref(node.Parent?.Number ?? root)}");

                if (index > 0)
                {
                    builder.Append($" /Prev {Ref(siblings[index - 1].Number)}");
                }

                if (index < siblings.Count - 1)
                {
                    builder.Append($" /Next {Ref(siblings[index + 1].Number)}");
                }

                if (node.Children.Count > 0)
                {
                    builder.Append($" /First {Ref(node.Children[0].Number)} /Last {Ref(node.Children[^1].Number)} /Count {node.Descendants}");
                }

                builder.Append($" /Dest [{Ref(pages[node.Entry.Page])} /XYZ 0 {PdfLayout.F(node.Entry.Top)} null] >>");
                file.Object(node.Number, builder.ToString());
            }
        }

        /// <summary>
        /// Returns a reference to an object.
        /// </summary>
        private static string Ref(int number)
        {
            return $"{number} 0 R";
        }

        /// <summary>
        /// Returns a text string. Text outside of printable ASCII is written in UTF-16 with a
        /// byte order mark, which is how PDF carries text that is not in its own encoding -
        /// a title or a bookmark may hold any character, unlike the page content.
        /// </summary>
        /// <param name="value">The text.</param>
        /// <returns>The string token.</returns>
        internal static string Text(string value)
        {
            if (value.All(c => c >= 32 && c <= 126))
            {
                return $"({PdfLayout.Escape(value)})";
            }

            return $"<FEFF{Convert.ToHexString(Encoding.BigEndianUnicode.GetBytes(value))}>";
        }

        /// <summary>
        /// Represents a bookmark while the tree is built.
        /// </summary>
        private sealed class OutlineNode(PdfLayout.OutlineEntry entry, int number)
        {
            public PdfLayout.OutlineEntry Entry { get; } = entry;
            public int Number { get; } = number;
            public OutlineNode Parent { get; set; }
            public List<OutlineNode> Children { get; } = [];
            public int Descendants => Children.Count + Children.Sum(c => c.Descendants);
        }

        /// <summary>
        /// Collects the objects of a file and the positions they start at.
        /// </summary>
        private sealed class FileBuilder
        {
            private readonly MemoryStream _body = new();
            private readonly List<long> _offsets = [];

            /// <summary>
            /// Reserves the next object number.
            /// </summary>
            /// <returns>The number.</returns>
            public int Reserve()
            {
                _offsets.Add(-1);

                return _offsets.Count;
            }

            /// <summary>
            /// Writes the file header. The comment with bytes above 127 tells transfer
            /// programs that the file is binary.
            /// </summary>
            public void Header()
            {
                Append("%PDF-1.4\n");
                _body.Write([(byte)'%', 0xE2, 0xE3, 0xCF, 0xD3, (byte)'\n']);
            }

            /// <summary>
            /// Writes an object.
            /// </summary>
            /// <param name="number">The object number.</param>
            /// <param name="content">The object.</param>
            public void Object(int number, string content)
            {
                _offsets[number - 1] = _body.Position;
                Append($"{number} 0 obj\n{content}\nendobj\n");
            }

            /// <summary>
            /// Writes a stream object.
            /// </summary>
            /// <param name="number">The object number.</param>
            /// <param name="entries">Further dictionary entries.</param>
            /// <param name="data">The stream data.</param>
            /// <param name="compress">Whether the data is to be compressed.</param>
            public void Stream(int number, string entries, byte[] data, bool compress)
            {
                if (compress)
                {
                    data = Deflate(data);
                    entries += " /Filter /FlateDecode";
                }

                WriteStream(number, entries, data);
            }

            /// <summary>
            /// Writes an image object.
            /// </summary>
            /// <param name="number">The object number.</param>
            /// <param name="image">The image.</param>
            /// <param name="mask">The number of the soft mask, or zero.</param>
            public void Image(int number, PdfImage image, int mask)
            {
                var entries = new StringBuilder();
                entries.Append($" /Type /XObject /Subtype /Image /Width {image.Width} /Height {image.Height}");
                entries.Append($" /ColorSpace {image.ColorSpace} /BitsPerComponent {image.BitsPerComponent} /Filter /{image.Filter}");

                if (image.DecodeParms is not null)
                {
                    entries.Append($" /DecodeParms {image.DecodeParms}");
                }

                if (image.Decode is not null)
                {
                    entries.Append($" /Decode {image.Decode}");
                }

                if (mask > 0)
                {
                    entries.Append($" /SMask {Ref(mask)}");
                }

                WriteStream(number, entries.ToString(), image.Data);
            }

            /// <summary>
            /// Writes the cross-reference table and the trailer, and copies the file to a
            /// stream.
            /// </summary>
            /// <param name="catalog">The number of the catalog.</param>
            /// <param name="info">The number of the information dictionary.</param>
            /// <param name="stream">The stream to write to.</param>
            public void Finish(int catalog, int info, Stream stream)
            {
                var id = Convert.ToHexString(MD5.HashData(_body.ToArray()));
                var xref = _body.Position;
                var builder = new StringBuilder();

                builder.Append($"xref\n0 {_offsets.Count + 1}\n0000000000 65535 f \n");

                foreach (var offset in _offsets)
                {
                    builder.Append(offset.ToString("0000000000", CultureInfo.InvariantCulture)).Append(" 00000 n \n");
                }

                builder.Append($"trailer\n<< /Size {_offsets.Count + 1} /Root {Ref(catalog)} /Info {Ref(info)} /ID [<{id}> <{id}>] >>\n");
                builder.Append($"startxref\n{xref}\n%%EOF\n");
                Append(builder.ToString());

                _body.Position = 0;
                _body.CopyTo(stream);
            }

            /// <summary>
            /// Writes a stream object with its length.
            /// </summary>
            private void WriteStream(int number, string entries, byte[] data)
            {
                _offsets[number - 1] = _body.Position;
                Append($"{number} 0 obj\n<<{entries} /Length {data.Length} >>\nstream\n");
                _body.Write(data);
                Append("\nendstream\nendobj\n");
            }

            /// <summary>
            /// Appends ASCII text.
            /// </summary>
            private void Append(string text)
            {
                _body.Write(Encoding.Latin1.GetBytes(text));
            }
        }
    }
}
