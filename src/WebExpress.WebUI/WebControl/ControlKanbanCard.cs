using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an card element in a kanban control.
    /// </summary>
    public class ControlKanbanCard : IControlKanbanCard
    {
        /// <summary>
        /// Returns the id of the control.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Returns or sets the title associated with the card.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Returns or sets the color associated with the card.
        /// </summary>
        public string Color { get; set; }

        /// <summary>
        /// Returns or sets the icon associated with this card.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Returns or sets the column id associated with this card.
        /// </summary>
        public string ColumnId { get; set; }

        /// <summary>
        /// Returns the unique identifier of the swimlane associated with this card.
        /// </summary>
        public string SwimlaneId { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlKanbanCard(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-kanban-card"
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Title))
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", (Icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color", Color)
                .AddUserAttribute("data-column-id", ColumnId)
                .AddUserAttribute("data-swimlane-id", SwimlaneId);

            return html;
        }
    }
}
