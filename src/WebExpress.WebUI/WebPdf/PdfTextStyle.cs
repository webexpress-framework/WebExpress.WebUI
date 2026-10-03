namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Describes how a run of text is set.
    /// <para>
    /// A style is immutable and is derived rather than changed (<c>style with { Bold = true }</c>),
    /// because the renderers build it while descending through nested markup: an emphasis
    /// inside a link inside a colored span adds to what its parents set, and must not leak
    /// back into the text that follows them.
    /// </para>
    /// </summary>
    public sealed record PdfTextStyle
    {
        /// <summary>
        /// Returns the style of plain body text.
        /// </summary>
        public static PdfTextStyle Default { get; } = new();

        /// <summary>
        /// Gets a value indicating whether the text is set in the bold face.
        /// </summary>
        public bool Bold { get; init; }

        /// <summary>
        /// Gets a value indicating whether the text is set in the italic face.
        /// </summary>
        public bool Italic { get; init; }

        /// <summary>
        /// Gets a value indicating whether the text is underlined.
        /// </summary>
        public bool Underline { get; init; }

        /// <summary>
        /// Gets a value indicating whether the text is struck through.
        /// </summary>
        public bool Strikethrough { get; init; }

        /// <summary>
        /// Gets a value indicating whether the text is raised and reduced.
        /// </summary>
        public bool Superscript { get; init; }

        /// <summary>
        /// Gets a value indicating whether the text is lowered and reduced.
        /// </summary>
        public bool Subscript { get; init; }

        /// <summary>
        /// Gets the font family, or null for the family of the document.
        /// </summary>
        public PdfFontFamily? FontFamily { get; init; }

        /// <summary>
        /// Gets the size relative to the font size of the document. A relative size is kept
        /// rather than an absolute one so a document can be reset in a larger size without
        /// rebuilding it.
        /// </summary>
        public float Scale { get; init; } = 1f;

        /// <summary>
        /// Gets the text color, or null for the color of the surrounding block.
        /// </summary>
        public PdfColor? Color { get; init; }

        /// <summary>
        /// Gets the color behind the text, or null for none.
        /// </summary>
        public PdfColor? Background { get; init; }

        /// <summary>
        /// Gets the address the text links to, or null. Only absolute http, https, mailto
        /// and ftp addresses become clickable; anything else - a relative path, a script -
        /// has no meaning in a file that is read away from the site.
        /// </summary>
        public string Link { get; init; }
    }
}
