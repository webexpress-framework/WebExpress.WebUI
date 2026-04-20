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
    /// Represents an item in a move input form.
    /// </summary>
    public class ControlFormItemInputMoveItem : IControlFormItemInputMoveItem
    {
        /// <summary>
        /// Returns the unique identifier of the selection item.
        /// </summary>
        [JsonPropertyName("id")]
        public string Id { get; }

        /// <summary>
        /// Gets or sets the text of the selection item.
        /// </summary>
        [JsonPropertyName("text")]
        public string Text { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with the selection item.
        /// </summary>
        [JsonPropertyName("icon")]
        public IIcon Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public IUri Image { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The unique identifier of the selection item. Optional.</param>
        public ControlFormItemInputMoveItem(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Converts the cell to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(Text)))
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-move-option"),
            }
                .AddUserAttribute("data-icon", Icon is Icon ? (Icon as Icon).Class : null)
                .AddUserAttribute("data-image", Image?.ToString() ?? (Icon is ImageIcon imageIcon ? imageIcon.Uri?.ToString() : null));

            return html;
        }
    }
}
