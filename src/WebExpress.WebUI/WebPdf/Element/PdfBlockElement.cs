namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents an element that takes the full width of its container and is stacked
    /// below its predecessor.
    /// </summary>
    public abstract class PdfBlockElement : IPdfElement
    {
        /// <summary>
        /// Returns the text of the element without any formatting.
        /// </summary>
        public virtual string PlainText => string.Empty;
    }
}
