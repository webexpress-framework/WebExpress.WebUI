using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a dropdown item link control.
    /// </summary>
    public class ControlDropdownItemLink : IControlDropdownItem
    {
        private readonly string _id;

        /// <summary>
        /// Returns the unique identifier for the entity.
        /// </summary>
        public string Id => _id;

        /// <summary>
        /// Returns or sets whether the link is active or not.
        /// </summary>
        public TypeActive Active { get; set; }

        /// <summary>
        /// Returns or sets the label.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Returns or sets the target uri.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Returns or sets the target.
        /// </summary>
        public TypeTarget Target { get; set; }

        /// <summary>
        /// Returns or sets the target of a modal dialogue.
        /// </summary>
        public IModalTarget Modal { get; set; }

        /// <summary>
        /// Returns or sets the icon.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Returns or sets a tooltip text.
        /// </summary>
        public string Tooltip { get; set; }

        /// <summary>
        /// Returns or sets the link color.
        /// </summary>
        public TypeColorText Color { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlDropdownItemLink(string id = null)
        {
            _id = id;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(renderContext, Text)))
            {
                Id = Id,
                Class = "wx-dropdown-item"
            }
                .AddUserAttribute("id", Id)
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", (Icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-tooltip", Tooltip)
                .AddUserAttribute("data-color", Color.ToClass());

            if (Modal is not null)
            {
                Modal?.ApplyUserAttributes(html);
                html.AddUserAttribute("data-wx-uri", Uri?.ToString());
            }
            else
            {
                html.AddUserAttribute("data-uri", Uri?.ToString());
                html.AddUserAttribute("data-target", Target.ToStringValue());
            }

            return html;
        }
    }
}
