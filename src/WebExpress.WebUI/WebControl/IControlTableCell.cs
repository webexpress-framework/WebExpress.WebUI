using WebExpress.WebCore.WebPage;
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
        /// Gets the class or category associated with the current object.
        /// </summary>
        string Class { get; }

        /// <summary>
        /// Gets the style applied to the element.
        /// </summary>
        string Style { get; }

        /// <summary>
        /// Gets the color scheme used for the cell.
        /// </summary>
        TypeColorTable Color { get; }
    }
}
