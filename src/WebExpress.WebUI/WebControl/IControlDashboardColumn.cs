using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a dashboard column.
    /// </summary>
    public interface IControlDashboardColumn : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the title associated with the column.
        /// </summary>
        string Title { get; }

        /// <summary>
        /// Gets the size descriptor associated with the column.
        /// </summary>
        string Size { get; }
    }
}
