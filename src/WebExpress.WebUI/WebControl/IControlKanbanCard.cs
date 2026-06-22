using System;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Contract for a single card on a Kanban board.
    /// </summary>
    public interface IControlKanbanCard : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the title associated with the card.
        /// </summary>
        Func<IRenderControlContext, string> Title { get; }

        /// <summary>
        /// Gets the color associated with the card.
        /// </summary>
        Func<IRenderControlContext, string> Color { get; }

        /// <summary>
        /// Gets the icon associated with this card.
        /// </summary>
        Func<IRenderControlContext, IIcon> Icon { get; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets the column id associated with this card.
        /// </summary>
        Func<IRenderControlContext, string> ColumnId { get; }

        /// <summary>
        /// Gets the unique identifier of the swimlane associated with this card.
        /// </summary>
        Func<IRenderControlContext, string> SwimlaneId { get; }
    }
}
