using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;

namespace WebExpress.WebUI.Test.WebPdf
{
    /// <summary>
    /// Reads a PDF file the way the tests need it: the objects by number, the decoded page
    /// content and the text the pages show. It understands exactly what the writer produces
    /// - a classic cross-reference table, literal strings, FlateDecode streams - and checks
    /// the parts of the structure a reader relies on, so a test fails on a damaged file
    /// rather than on a missing word.
    /// </summary>
    public sealed partial class PdfInspector
    {
        private static readonly Encoding WinAnsi = CreateWinAnsi();

        /// <summary>
        /// Returns the file decoded byte for byte.
        /// </summary>
        public string Raw { get; }

        /// <summary>
        /// Returns the objects by their number, with streams decoded.
        /// </summary>
        public IReadOnlyDictionary<int, string> Objects { get; }

        /// <summary>
        /// Returns the decoded content streams of the pages, in page order.
        /// </summary>
        public IReadOnlyList<string> PageContents { get; }

        /// <summary>
        /// Returns the number of pages.
        /// </summary>
        public int PageCount => PageContents.Count;

        /// <summary>
        /// Returns the strings shown by text operations, per page, in drawing order.
        /// </summary>
        public IReadOnlyList<IReadOnlyList<string>> PageTexts { get; }

        /// <summary>
        /// Returns all shown strings joined by spaces.
        /// </summary>
        public string Text => string.Join(" ", PageTexts.SelectMany(x => x));

        /// <summary>
        /// Initializes a new instance of the class and validates the file structure.
        /// </summary>
        /// <param name="data">The file.</param>
        public PdfInspector(byte[] data)
        {
            Raw = Encoding.Latin1.GetString(data);

            Assert.StartsWith("%PDF-1.4\n", Raw);
            Assert.EndsWith("%%EOF\n", Raw);

            var objects = new Dictionary<int, string>();
            var startxref = int.Parse(Regex.Match(Raw, @"startxref\n(\d+)\n%%EOF\n$").Groups[1].Value, CultureInfo.InvariantCulture);
            var xref = Raw[startxref..];

            Assert.StartsWith("xref\n0 ", xref);

            var size = int.Parse(Regex.Match(xref, @"^xref\n0 (\d+)\n").Groups[1].Value, CultureInfo.InvariantCulture);
            var entries = Regex.Matches(xref, @"(\d{10}) (\d{5}) ([nf]) \n").ToList();

            Assert.Equal(size, entries.Count);

            for (var number = 1; number < size; number++)
            {
                var offset = int.Parse(entries[number].Groups[1].Value, CultureInfo.InvariantCulture);
                var header = $"{number} 0 obj\n";

                Assert.True(Raw.AsSpan(offset).StartsWith(header), $"the cross-reference entry of object {number} points to its header");

                var body = offset + header.Length;
                var end = Raw.IndexOf("\nendobj\n", body, StringComparison.Ordinal);
                var content = Raw[body..end];
                var stream = content.IndexOf(">>\nstream\n", StringComparison.Ordinal);

                if (stream >= 0)
                {
                    var dictionary = content[..stream];
                    var length = int.Parse(LengthPattern().Match(dictionary).Groups[1].Value, CultureInfo.InvariantCulture);
                    var start = body + stream + ">>\nstream\n".Length;

                    Assert.Equal("\nendstream", Raw.Substring(start + length, "\nendstream".Length));

                    var bytes = data.AsSpan(start, length).ToArray();

                    if (dictionary.Contains("/Filter /FlateDecode") && !dictionary.Contains("/Subtype /Image"))
                    {
                        bytes = Inflate(bytes);
                    }

                    content = dictionary + ">>\nstream\n" + Encoding.Latin1.GetString(bytes);
                }

                objects[number] = content;
            }

            Objects = objects;

            var kids = Regex.Match(objects.Values.Single(o => o.StartsWith("<< /Type /Pages")), @"/Kids \[([^\]]*)\]").Groups[1].Value;
            var pages = Regex.Matches(kids, @"(\d+) 0 R").Select(m => int.Parse(m.Groups[1].Value, CultureInfo.InvariantCulture)).ToList();

            PageContents = pages
                .Select(p => int.Parse(Regex.Match(objects[p], @"/Contents (\d+) 0 R").Groups[1].Value, CultureInfo.InvariantCulture))
                .Select(c => objects[c][(objects[c].IndexOf("stream\n", StringComparison.Ordinal) + "stream\n".Length)..])
                .ToList();

            PageTexts = PageContents.Select(c => (IReadOnlyList<string>)ShownStrings(c).ToList()).ToList();
        }

        /// <summary>
        /// Returns the objects whose dictionary contains a fragment.
        /// </summary>
        /// <param name="fragment">The fragment, for example <c>/Subtype /Image</c>.</param>
        /// <returns>The objects.</returns>
        public IEnumerable<string> Find(string fragment)
        {
            return Objects.Values.Where(o => o.Contains(fragment, StringComparison.Ordinal));
        }

        /// <summary>
        /// Returns the text operations of a page with their position and font size.
        /// </summary>
        /// <param name="page">The page index.</param>
        /// <returns>The operations.</returns>
        public IEnumerable<(string Text, float X, float Y, float Size)> TextRuns(int page)
        {
            foreach (Match match in TextRunPattern().Matches(PageContents[page]))
            {
                yield return (
                    Decode(match.Groups[4].Value),
                    float.Parse(match.Groups[2].Value, CultureInfo.InvariantCulture),
                    float.Parse(match.Groups[3].Value, CultureInfo.InvariantCulture),
                    float.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture));
            }
        }

        /// <summary>
        /// Returns the decoded strings of the text operations of a content stream.
        /// </summary>
        private static IEnumerable<string> ShownStrings(string content)
        {
            return TextRunPattern().Matches(content).Select(m => Decode(m.Groups[4].Value));
        }

        /// <summary>
        /// Turns the body of a literal string back into text.
        /// </summary>
        /// <param name="literal">The escaped string without its parentheses.</param>
        /// <returns>The text.</returns>
        public static string Decode(string literal)
        {
            var bytes = new List<byte>();

            for (var i = 0; i < literal.Length; i++)
            {
                if (literal[i] == '\\' && i + 1 < literal.Length)
                {
                    if (char.IsDigit(literal[i + 1]))
                    {
                        bytes.Add(Convert.ToByte(literal.Substring(i + 1, 3), 8));
                        i += 3;
                    }
                    else
                    {
                        bytes.Add((byte)literal[i + 1]);
                        i++;
                    }
                }
                else
                {
                    bytes.Add((byte)literal[i]);
                }
            }

            return WinAnsi.GetString(bytes.ToArray());
        }

        /// <summary>
        /// Decompresses a FlateDecode stream.
        /// </summary>
        private static byte[] Inflate(byte[] data)
        {
            using var input = new ZLibStream(new MemoryStream(data), CompressionMode.Decompress);
            using var output = new MemoryStream();
            input.CopyTo(output);

            return output.ToArray();
        }

        /// <summary>
        /// Returns the Windows-1252 encoding, which is what WinAnsi is.
        /// </summary>
        private static Encoding CreateWinAnsi()
        {
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

            return Encoding.GetEncoding(1252);
        }

        [GeneratedRegex(@"/Length (\d+)")]
        private static partial Regex LengthPattern();

        [GeneratedRegex(@"BT /F\d+ ([\d.]+) Tf [\d. ]+ rg ([\d.-]+) ([\d.-]+) Td \(((?:\\.|[^\\)])*)\) Tj ET")]
        private static partial Regex TextRunPattern();
    }
}
