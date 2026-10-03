using System.Collections.Generic;
using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebComponent;
using WebExpress.WebUI.WebPdf.Element;

namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Defines what a plugin element of a <see cref="PdfDocument"/> becomes. It is the server
    /// side of a markdown plugin: the text names the plugin and passes parameters, and an
    /// implementation outside of the framework decides how that looks on paper - a chart as a
    /// picture, a ticket reference as a link, a signature field as a table.
    /// <para>
    /// A public, sealed class of a WebExpress plugin that implements the interface and carries
    /// a <see cref="NameAttribute"/> is registered under that name when the plugin is loaded
    /// and removed when it is unloaded, by <see cref="PdfPluginManager"/>. Outside of a server -
    /// in a test or a tool - an instance is registered with
    /// <see cref="PdfPluginRegistry.Register"/>.
    /// </para>
    /// <para>
    /// A plugin builds its result from the elements of the PDF model rather than drawing on
    /// the page, so page breaks, measuring inside table cells and the bookmarks keep working
    /// for it. The result may itself contain plugin elements, which are resolved in turn.
    /// A plugin is asked again for every document that is written, and must not assume it is
    /// called on a particular thread. Its constructor may ask for the host context and the
    /// component hub, as other components do.
    /// </para>
    /// </summary>
    public interface IPdfPlugin : IComponent
    {
        /// <summary>
        /// Converts a block plugin element. The default shows the enclosed content, as an
        /// unregistered plugin does, so a plugin that only has an inline form needs no block
        /// form.
        /// </summary>
        /// <param name="element">The element, with its parameters and content.</param>
        /// <returns>The blocks that take the element's place.</returns>
        IEnumerable<PdfBlockElement> ConvertBlock(PdfBlockElementPlugin element)
        {
            return element.Content;
        }

        /// <summary>
        /// Converts an inline plugin element. The default leaves it out, as an unregistered
        /// plugin is left out, so a plugin that only has a block form needs no inline form.
        /// </summary>
        /// <param name="element">The element, with its parameters and the surrounding style.</param>
        /// <returns>The inline elements that take the element's place.</returns>
        IEnumerable<PdfInlineElement> ConvertInline(PdfInlineElementPlugin element)
        {
            return [];
        }
    }
}
