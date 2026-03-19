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
        /// Returns the title associated with the object.
        /// </summary>
        string Title { get; }

        /// <summary>
        /// Returns the size descriptor associated with the object.
        /// </summary>
        string Size { get; }
    }
}
