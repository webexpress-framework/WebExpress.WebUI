namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a node of a <see cref="PdfDocument"/>. The model is a flow of blocks, not
    /// a set of positioned shapes: where an element ends up on which page is decided only
    /// when the document is written, so the same model can be set on any page size.
    /// </summary>
    public interface IPdfElement
    {
        /// <summary>
        /// Returns the text of the element without any formatting.
        /// </summary>
        string PlainText { get; }
    }
}
