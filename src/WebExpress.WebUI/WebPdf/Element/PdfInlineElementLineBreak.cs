namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a forced line break within a paragraph.
    /// </summary>
    public class PdfInlineElementLineBreak : PdfInlineElement
    {
        /// <summary>
        /// Returns the text of the element without any formatting.
        /// </summary>
        public override string PlainText => "\n";
    }
}
