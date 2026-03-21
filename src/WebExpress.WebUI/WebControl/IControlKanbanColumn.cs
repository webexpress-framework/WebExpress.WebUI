using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a kanban column.
    /// </summary>
    public interface IControlKanbanColumn : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Returns the title associated with the column.
        /// </summary>
        string Title { get; }

        /// <summary>
        /// Returns the size descriptor associated with the column.
        /// </summary>
        string Size { get; }
    }
}
