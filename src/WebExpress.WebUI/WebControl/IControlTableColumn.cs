using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a column in a control table.
    /// </summary>
    public interface IControlTableColumn : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Returns the header text.
        /// </summary>
        string Title { get; }

        /// <summary>
        /// Returns the icon.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Returns the color scheme used for the column.
        /// </summary>
        TypeColorTable Color { get; }
    }
}
