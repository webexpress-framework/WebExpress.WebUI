using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a kanban swimlane.
    /// </summary>
    public interface IControlKanbanSwimlane : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Returns the title associated with the swimlane.
        /// </summary>
        string Title { get; }

        /// <summary>
        /// Returns a value indicating whether the content is currently expanded.
        /// </summary>
        bool Expanded { get; }
    }
}
