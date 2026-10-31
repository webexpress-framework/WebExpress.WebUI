namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a run of text in one style. Runs of whitespace are collapsed into a single
    /// space and may break the line, as in a browser; a forced break is a
    /// <see cref="PdfInlineElementLineBreak"/>.
    /// </summary>
    public class PdfInlineElementText : PdfInlineElement
    {
        /// <summary>
        /// Returns the text.
        /// </summary>
        public string Text { get; }

        /// <summary>
        /// Returns the style the text is set in.
        /// </summary>
        public PdfTextStyle Style { get; }

        /// <summary>
        /// Returns the text of the element without any formatting.
        /// </summary>
        public override string PlainText => Text;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="text">The text.</param>
        /// <param name="style">The style, or null for plain body text.</param>
        public PdfInlineElementText(string text, PdfTextStyle style = null)
        {
            Text = text ?? string.Empty;
            Style = style ?? PdfTextStyle.Default;
        }
    }
}
