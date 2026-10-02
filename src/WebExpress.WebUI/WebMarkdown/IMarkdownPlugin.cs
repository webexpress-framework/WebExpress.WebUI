using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebComponent;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebMarkdown.Element;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebMarkdown
{
    /// <summary>
    /// Defines what a plugin element of a <see cref="MarkdownDocument"/> becomes on a page. The
    /// text names the plugin and passes parameters, and an implementation outside of the
    /// framework decides how that looks in HTML - a ticket reference as a link, a chart as a
    /// control, a note as a callout. It is the page counterpart of
    /// <see cref="WebPdf.IPdfPlugin"/>.
    /// <para>
    /// A public, sealed class of a WebExpress plugin that implements the interface and carries
    /// a <see cref="NameAttribute"/> is registered under that name when the plugin is loaded
    /// and removed when it is unloaded, by <see cref="MarkdownPluginManager"/>. Outside of a
    /// server - in a test or a tool - an instance is registered with
    /// <see cref="MarkdownPluginRegistry.Register"/>.
    /// </para>
    /// <para>
    /// A plugin is asked again for every document that is rendered, and must not assume it is
    /// called on a particular thread. Its constructor may ask for the host context and the
    /// component hub, as other components do.
    /// </para>
    /// </summary>
    public interface IMarkdownPlugin : IComponent
    {
        /// <summary>
        /// Converts a block plugin element. The default returns null, which keeps the
        /// placeholder an unregistered plugin gets - a <c>div</c> with the enclosed content
        /// and the <c>data-plugin</c> attributes a script on the page can pick up - so a plugin
        /// that only has an inline form needs no block form.
        /// </summary>
        /// <param name="element">The element, with its parameters and content.</param>
        /// <param name="content">The enclosed content, already rendered.</param>
        /// <param name="renderContext">The context in which the document is rendered.</param>
        /// <returns>The node that takes the element's place, or null for the placeholder.</returns>
        IHtmlNode ConvertBlock(MarkdownBlockElementPlugin element, IHtmlNode content, IRenderControlContext renderContext)
        {
            return null;
        }

        /// <summary>
        /// Converts an inline plugin element. The default returns null, which keeps the
        /// placeholder an unregistered plugin gets, so a plugin that only has a block form
        /// needs no inline form.
        /// </summary>
        /// <param name="element">The element, with its parameters.</param>
        /// <param name="renderContext">The context in which the document is rendered.</param>
        /// <returns>The node that takes the element's place, or null for the placeholder.</returns>
        IHtmlNode ConvertInline(MarkdownInlineElementPlugin element, IRenderControlContext renderContext)
        {
            return null;
        }
    }
}
