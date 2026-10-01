using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using WebExpress.WebUI.WebPdf.Element;

namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Root node of a PDF document: a flow of blocks plus the settings for setting them on
    /// pages.
    /// <para>
    /// The model is filled by a renderer - <see cref="PdfRendererMarkdown"/> or
    /// <see cref="PdfRendererHtml"/> - or by hand, and is
    /// laid out only when it is written. Until then nothing is positioned, so page size,
    /// margins and font can be changed after the content has been converted.
    /// </para>
    /// <para>
    /// The file is produced entirely in-process, without a browser or a third-party library,
    /// so it can be created wherever the server runs - in a job, a REST endpoint or a mail
    /// handler.
    /// </para>
    /// </summary>
    public class PdfDocument
    {
        private readonly List<PdfBlockElement> _elements = [];

        /// <summary>
        /// Returns the blocks of the document.
        /// </summary>
        public IEnumerable<PdfBlockElement> Elements => _elements;

        /// <summary>
        /// Gets or sets the title, which a reader shows in its window instead of the file name.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the author.
        /// </summary>
        public string Author { get; set; }

        /// <summary>
        /// Gets or sets the subject.
        /// </summary>
        public string Subject { get; set; }

        /// <summary>
        /// Gets or sets the keywords.
        /// </summary>
        public string Keywords { get; set; }

        /// <summary>
        /// Gets or sets the language of the content as a BCP 47 tag, for example <c>de-DE</c>,
        /// which screen readers use to pick a voice.
        /// </summary>
        public string Language { get; set; }

        /// <summary>
        /// Gets or sets the creation date, or null for the moment the file is written. A fixed
        /// date makes the output reproducible byte for byte.
        /// </summary>
        public DateTimeOffset? CreationDate { get; set; }

        /// <summary>
        /// Gets or sets the size of the pages.
        /// </summary>
        public PdfPageSize PageSize { get; set; } = PdfPageSize.A4;

        /// <summary>
        /// Gets or sets the white space around the content of a page. Defaults to 20 mm.
        /// </summary>
        public PdfMargin Margin { get; set; } = new(PdfPageSize.FromMillimeters(20));

        /// <summary>
        /// Gets or sets the font family of the body text.
        /// </summary>
        public PdfFontFamily FontFamily { get; set; } = PdfFontFamily.Helvetica;

        /// <summary>
        /// Gets or sets the size of the body text in points. Headings and code are sized
        /// relative to it.
        /// </summary>
        public float FontSize { get; set; } = 10.5f;

        /// <summary>
        /// Gets or sets the text set at the top of every page, or null for none. The
        /// placeholders <c>{page}</c> and <c>{pages}</c> are replaced by the page number and
        /// the page count.
        /// </summary>
        public string Header { get; set; }

        /// <summary>
        /// Gets or sets the text set at the bottom of every page, or null for none. The
        /// placeholders <c>{page}</c> and <c>{pages}</c> are replaced by the page number and
        /// the page count, for example <c>"Page {page} of {pages}"</c>.
        /// </summary>
        public string Footer { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the headings are written as bookmarks.
        /// </summary>
        public bool Outline { get; set; } = true;

        /// <summary>
        /// Gets or sets a value indicating whether the page content is compressed. Switching
        /// it off yields a larger file whose drawing instructions can be read in a text
        /// editor, which is what tests and troubleshooting want.
        /// </summary>
        public bool Compress { get; set; } = true;

        /// <summary>
        /// Gets or sets the function that loads the picture behind an address that is not a
        /// <c>data:</c> address, or null to load none. It receives the address as written and
        /// returns the encoded picture, or null. The caller decides which addresses are
        /// trustworthy - an asset of the application, a file of the record being printed -
        /// because the renderer itself must not reach out to whatever a text names.
        /// </summary>
        public Func<string, byte[]> ImageResolver { get; set; }

        /// <summary>
        /// Returns the text of the document without any formatting.
        /// </summary>
        public string PlainText => string.Join("\n", _elements.Select(x => x.PlainText));

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public PdfDocument()
        {
        }

        /// <summary>
        /// Adds one or more blocks to the document.
        /// </summary>
        /// <param name="elements">The blocks to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfDocument Add(params PdfBlockElement[] elements)
        {
            _elements.AddRange(elements.Where(x => x is not null));

            return this;
        }

        /// <summary>
        /// Adds one or more blocks to the document.
        /// </summary>
        /// <param name="elements">The blocks to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfDocument Add(IEnumerable<PdfBlockElement> elements)
        {
            _elements.AddRange(elements?.Where(x => x is not null) ?? []);

            return this;
        }

        /// <summary>
        /// Lays the document out and writes it as a PDF file.
        /// </summary>
        /// <param name="stream">The stream to write to.</param>
        public void Save(Stream stream)
        {
            ArgumentNullException.ThrowIfNull(stream);

            PdfWriter.Write(this, stream);
        }

        /// <summary>
        /// Lays the document out and returns the PDF file.
        /// </summary>
        /// <returns>The content of the file.</returns>
        public byte[] ToArray()
        {
            using var stream = new MemoryStream();
            Save(stream);

            return stream.ToArray();
        }
    }
}
