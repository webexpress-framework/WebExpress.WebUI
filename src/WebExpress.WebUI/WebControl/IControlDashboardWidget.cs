using System;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Contract for a dashboard widget, a single panel shown on a dashboard.
    /// </summary>
    public interface IControlDashboardWidget : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the title associated with the widget.
        /// </summary>
        Func<IRenderControlContext, string> Title { get; }

        /// <summary>
        /// Gets the color associated with the widget.
        /// </summary>
        Func<IRenderControlContext, string> Color { get; }

        /// <summary>
        /// Gets the icon associated with this widget.
        /// </summary>
        Func<IRenderControlContext, IIcon> Icon { get; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets the column index associated with this widget.
        /// </summary>
        Func<IRenderControlContext, uint> Column { get; }

        /// <summary>
        /// Gets a value indicating whether the widget can be moved.
        /// </summary>
        Func<IRenderControlContext, bool> Movable { get; }

        /// <summary>
        /// Gets a value indicating whether the widget can be closed.
        /// </summary>
        Func<IRenderControlContext, bool> Closeable { get; }
    }
}
