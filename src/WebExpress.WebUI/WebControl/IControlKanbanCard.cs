using System;
using System.Collections.Generic;
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

        /// <summary>
        /// Gets the id of the person the card is assigned to. When absent,
        /// the card renders without an assignee avatar.
        /// </summary>
        Func<IRenderControlContext, string> AssigneeId { get; }

        /// <summary>
        /// Gets the display name of the assignee, shown as the avatar tooltip.
        /// </summary>
        Func<IRenderControlContext, string> AssigneeName { get; }

        /// <summary>
        /// Gets the short text shown inside the assignee avatar. When absent,
        /// the initials are derived from the assignee name on the client.
        /// </summary>
        Func<IRenderControlContext, string> AssigneeInitials { get; }

        /// <summary>
        /// Gets the CSS color used as the assignee avatar background.
        /// </summary>
        Func<IRenderControlContext, string> AssigneeColor { get; }

        /// <summary>
        /// Gets the assignee avatar image. An image icon carries the picture uri;
        /// when present, the image replaces the initials badge.
        /// </summary>
        Func<IRenderControlContext, IIcon> AssigneeImage { get; }

        /// <summary>
        /// Gets the optional footer of the card: small, application-defined
        /// chips such as the priority or the story points.
        /// </summary>
        IEnumerable<ControlKanbanCardChip> Footer { get; }
    }
}
