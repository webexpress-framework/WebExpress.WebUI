using System;
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
        /// Gets the title associated with the swimlane.
        /// </summary>
        Func<IRenderControlContext, string> Title { get; }

        /// <summary>
        /// Gets a value indicating whether the content is currently expanded.
        /// </summary>
        Func<IRenderControlContext, bool> Expanded { get; }
    }
}
