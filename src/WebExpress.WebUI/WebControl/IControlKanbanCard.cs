using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a kanban card.
    /// </summary>
    public interface IControlKanbanCard : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the title associated with the card.
        /// </summary>
        string Title { get; }

        /// <summary>
        /// Gets the color associated with the card.
        /// </summary>
        string Color { get; }

        /// <summary>
        /// Gets the icon associated with this card.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        IUri Image { get; set; }

        /// <summary>
        /// Gets the column id associated with this card.
        /// </summary>
        string ColumnId { get; }

        /// <summary>
        /// Gets the unique identifier of the swimlane associated with this card.
        /// </summary>
        string SwimlaneId { get; }
    }
}
