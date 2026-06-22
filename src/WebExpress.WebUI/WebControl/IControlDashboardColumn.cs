using System;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Contract for a column within a dashboard layout that holds a vertical stack of widgets.
    /// </summary>
    public interface IControlDashboardColumn : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the title associated with the column.
        /// </summary>
        Func<IRenderControlContext, string> Title { get; }

        /// <summary>
        /// Gets the size descriptor associated with the column.
        /// </summary>
        Func<IRenderControlContext, string> Size { get; }
    }
}
