using WebExpress.WebCore.WebAttribute;
using WebExpress.WebUI.WebPdf;
using WebExpress.WebUI.WebPdf.Element;

namespace WebExpress.WebUI.Test.WebPdf
{
    /// <summary>
    /// A PDF plugin of the test plugin, so the discovery by <see cref="PdfPluginManager"/>
    /// can be checked against an assembly the plugin manager actually loads.
    /// </summary>
    [Name("testpdf")]
    public sealed class TestPdfPlugin : IPdfPlugin
    {
        /// <summary>
        /// Writes the parameter "text" in place of the element.
        /// </summary>
        /// <param name="element">The element.</param>
        /// <returns>The inline elements that take the element's place.</returns>
        public IEnumerable<PdfInlineElement> ConvertInline(PdfInlineElementPlugin element)
        {
            return [new PdfInlineElementText(element.Parameters.GetValueOrDefault("text"), element.Style)];
        }
    }
}
