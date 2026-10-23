namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a block of preformatted text, set in a monospaced face on a shaded
    /// background. Whitespace and line breaks are kept as they are; a line that is wider
    /// than the page is wrapped rather than cut off, because a printed page cannot scroll.
    /// </summary>
    public class PdfBlockElementCode : PdfBlockElement
    {
        /// <summary>
        /// Returns the code.
        /// </summary>
        public string Code { get; }

        /// <summary>
        /// Returns the language the code is written in, or null.
        /// </summary>
        public string Language { get; }

        /// <summary>
        /// Returns the text of the element without any formatting.
        /// </summary>
        public override string PlainText => Code;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="code">The code.</param>
        /// <param name="language">The language, or null.</param>
        public PdfBlockElementCode(string code, string language = null)
        {
            Code = code ?? string.Empty;
            Language = language;
        }
    }
}
