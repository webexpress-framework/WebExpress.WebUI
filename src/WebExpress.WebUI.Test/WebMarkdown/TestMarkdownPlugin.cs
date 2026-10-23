using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebMarkdown;
using WebExpress.WebUI.WebMarkdown.Element;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebMarkdown
{
    /// <summary>
    /// A markdown plugin of the test plugin, so the discovery by
    /// <see cref="MarkdownPluginManager"/> can be checked against an assembly the plugin
    /// manager actually loads.
    /// </summary>
    [Name("testmarkdown")]
    public sealed class TestMarkdownPlugin : IMarkdownPlugin
    {
        /// <summary>
        /// Writes the parameter "text" in place of the element.
        /// </summary>
        /// <param name="element">The element.</param>
        /// <param name="renderContext">The context in which the document is rendered.</param>
        /// <returns>The node that takes the element's place.</returns>
        public IHtmlNode ConvertInline(MarkdownInlineElementPlugin element, IRenderControlContext renderContext)
        {
            return new HtmlText(element.Parameters.GetValueOrDefault("text"));
        }
    }
}
