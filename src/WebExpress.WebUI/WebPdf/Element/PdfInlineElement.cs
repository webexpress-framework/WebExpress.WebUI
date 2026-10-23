namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents an element that flows within the lines of a paragraph or heading.
    /// </summary>
    public abstract class PdfInlineElement : IPdfElement
    {
        /// <summary>
        /// Returns the text of the element without any formatting.
        /// </summary>
        public virtual string PlainText => string.Empty;
    }
}
