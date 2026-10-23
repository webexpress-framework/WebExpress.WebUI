namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a forced page break. On a page that has no content yet it does nothing, so
    /// two breaks in a row do not leave an empty page behind.
    /// </summary>
    public class PdfBlockElementPageBreak : PdfBlockElement
    {
    }
}
