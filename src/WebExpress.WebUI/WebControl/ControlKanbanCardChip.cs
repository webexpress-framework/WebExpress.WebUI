using System;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A single chip in the optional footer of a Kanban card. The footer
    /// carries small, application-defined facts such as the priority or the
    /// story points, so the card layout stays generic while every application
    /// decides which information matters on its board.
    /// </summary>
    public class ControlKanbanCardChip
    {
        /// <summary>
        /// Gets or sets the text shown inside the chip.
        /// </summary>
        public Func<IRenderControlContext, string> Label { get; set; }

        /// <summary>
        /// Gets or sets the icon of the chip. An <see cref="WebIcon.ImageIcon"/>
        /// contributes its picture uri, any other icon its CSS class.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the color of the chip. A system color is emitted as a
        /// CSS class, a user-defined color as an inline style; when not set,
        /// the stylesheet default applies.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackgroundBadge> Color { get; set; }

        /// <summary>
        /// Gets or sets the tooltip explaining the chip (for example "Story points").
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }
    }
}
