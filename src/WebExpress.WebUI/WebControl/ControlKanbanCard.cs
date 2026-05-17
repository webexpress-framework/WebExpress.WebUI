using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
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
        /// Gets the id of the control.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets or sets the title associated with the card.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets the color associated with the card.
        /// </summary>
        public Func<IRenderControlContext, string> Color { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with this card.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the column id associated with this card.
        /// </summary>
        public Func<IRenderControlContext, string> ColumnId { get; set; }

        /// <summary>
        /// Gets the unique identifier of the swimlane associated with this card.
        /// </summary>
        public Func<IRenderControlContext, string> SwimlaneId { get; set; }

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
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Title?.Invoke(renderContext)))
                .AddUserAttribute("data-icon", (Icon?.Invoke(renderContext) as Icon)?.Class)
                .AddUserAttribute("data-image", Image?.Invoke(renderContext)?.ToString() ?? (Icon?.Invoke(renderContext) as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color", Color?.Invoke(renderContext))
                .AddUserAttribute("data-column-id", ColumnId?.Invoke(renderContext))
                .AddUserAttribute("data-swimlane-id", SwimlaneId?.Invoke(renderContext));

            return html;
        }
    }
}
