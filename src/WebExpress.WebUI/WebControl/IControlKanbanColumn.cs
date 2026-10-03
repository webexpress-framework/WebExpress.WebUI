using System;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Contract for a column on a Kanban board that holds the cards of one stage.
    /// </summary>
    public interface IControlKanbanColumn : IWebUIElement<IRenderControlContext, IVisualTreeControl>
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
