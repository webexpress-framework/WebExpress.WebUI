using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A single card on a Kanban board, representing one item that can be moved between columns.
    /// </summary>
    public class ControlKanbanCard : IControlKanbanCard
    {
        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        private readonly List<ControlKanbanCardChip> _footer = [];

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
        /// Gets or sets the id of the person the card is assigned to. When absent,
        /// the card renders without an assignee avatar.
        /// </summary>
        public Func<IRenderControlContext, string> AssigneeId { get; set; }

        /// <summary>
        /// Gets or sets the display name of the assignee, shown as the avatar tooltip.
        /// </summary>
        public Func<IRenderControlContext, string> AssigneeName { get; set; }

        /// <summary>
        /// Gets or sets the short text shown inside the assignee avatar. When absent,
        /// the initials are derived from the assignee name on the client.
        /// </summary>
        public Func<IRenderControlContext, string> AssigneeInitials { get; set; }

        /// <summary>
        /// Gets or sets the CSS color used as the assignee avatar background.
        /// </summary>
        public Func<IRenderControlContext, string> AssigneeColor { get; set; }

        /// <summary>
        /// Gets or sets the assignee avatar image. An <see cref="ImageIcon"/> carries
        /// the picture uri; when present, the image replaces the initials badge.
        /// </summary>
        public Func<IRenderControlContext, IIcon> AssigneeImage { get; set; }

        /// <summary>
        /// Gets the optional footer of the card: small, application-defined
        /// chips such as the priority or the story points.
        /// </summary>
        public IEnumerable<ControlKanbanCardChip> Footer => _footer;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlKanbanCard(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Adds one or more chips to the footer of the card.
        /// </summary>
        /// <param name="chips">The chips to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlKanbanCard Add(params ControlKanbanCardChip[] chips)
        {
            _footer.AddRange(chips);

            return this;
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
                .AddUserAttribute("data-swimlane-id", SwimlaneId?.Invoke(renderContext))
                .AddUserAttribute("data-assignee-id", AssigneeId?.Invoke(renderContext))
                .AddUserAttribute("data-assignee-name", AssigneeName?.Invoke(renderContext))
                .AddUserAttribute("data-assignee-initials", AssigneeInitials?.Invoke(renderContext))
                .AddUserAttribute("data-assignee-color", AssigneeColor?.Invoke(renderContext))
                .AddUserAttribute("data-assignee-image", (AssigneeImage?.Invoke(renderContext) as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-footer", RenderFooter(renderContext));

            return html;
        }

        /// <summary>
        /// Serializes the footer chips into the JSON payload the client parses.
        /// The icon collapses into one spec: an image icon contributes its uri,
        /// any other icon its CSS class. A system color is emitted as a CSS
        /// class, a user-defined color as an inline style, exactly like a
        /// control button. The JSON is html-encoded because the attribute
        /// renderer emits values verbatim.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The encoded JSON array, or null when the footer is empty.</returns>
        private string RenderFooter(IRenderControlContext renderContext)
        {
            if (_footer.Count == 0)
            {
                return null;
            }

            var chips = _footer.Select(chip =>
            {
                var icon = chip.Icon?.Invoke(renderContext);
                var color = chip.Color?.Invoke(renderContext);

                return new
                {
                    label = I18N.Translate(renderContext, chip.Label?.Invoke(renderContext)),
                    icon = (icon as ImageIcon)?.Uri?.ToString() ?? (icon as Icon)?.Class,
                    colorCss = color?.ToClass(),
                    colorStyle = color?.ToStyle(),
                    title = I18N.Translate(renderContext, chip.Title?.Invoke(renderContext))
                };
            });

            return WebUtility.HtmlEncode(JsonSerializer.Serialize(chips, _jsonOptions));
        }
    }
}
