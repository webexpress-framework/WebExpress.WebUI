using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a dashboard widget.
    /// </summary>
    public interface IControlDashboardWidget : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the title associated with the widget.
        /// </summary>
        string Title { get; }

        /// <summary>
        /// Gets the color associated with the widget.
        /// </summary>
        string Color { get; }

        /// <summary>
        /// Gets the icon associated with this widget.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Gets the column index associated with this widget.
        /// </summary>
        uint Column { get; }

        /// <summary>
        /// Gets a value indicating whether the widget can be moved.
        /// </summary>
        bool Movable { get; }

        /// <summary>
        /// Gets a value indicating whether the widget can be closed.
        /// </summary>
        bool Closeable { get; }
    }
}
