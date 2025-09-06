using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a table cell in a control, providing access to its unique identifier,  classification, style,
    /// associated icon, and content.
    /// </summary>
    public interface IControlTableCell : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Returns the class or category associated with the current object.
        /// </summary>
        string Class { get; }

        /// <summary>
        /// Returns the style applied to the element.
        /// </summary>
        string Style { get; }

        /// <summary>
        /// Returns the color scheme used for the cell.
        /// </summary>
        TypeColorTable Color { get; }

        /// <summary>
        /// Returns the icon associated with this instance.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Returns or sets the URI associated with the current resource.
        /// </summary>
        IUri Uri { get; }

        /// <summary>
        /// Returns or sets the target.
        /// </summary>
        TypeTarget Target { get; }

        /// <summary>
        /// Returns or sets the id of a modal dialogue.
        /// </summary>
        string Modal { get; }

        /// <summary>
        /// Returns the content associated with this instance.
        /// </summary>
        string Text { get; }
    }
}
