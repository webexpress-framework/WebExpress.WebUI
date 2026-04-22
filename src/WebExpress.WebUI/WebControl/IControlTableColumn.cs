using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a column in a control table.
    /// </summary>
    public interface IControlTableColumn : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the header text.
        /// </summary>
        string Title { get; }

        /// <summary>
        /// Gets the icon.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        IUri Image { get; set; }

        /// <summary>
        /// Gets the color scheme used for the column.
        /// </summary>
        TypeColorTable Color { get; }
    }
}
