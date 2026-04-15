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
        /// Gets or sets whether the link is active or not.
        /// </summary>
        public TypeActive Active { get; set; }

        /// <summary>
        /// Gets or sets the label.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Gets or sets the target uri.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Gets or sets the target.
        /// </summary>
        public TypeTarget Target { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        public IAction PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        public IAction SecondaryAction { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Gets or sets a tooltip text.
        /// </summary>
        public string Tooltip { get; set; }

        /// <summary>
        /// Gets or sets the link color.
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
            return Render(renderContext, visualTree, Text, Tooltip, Icon, Color, Uri, Target, PrimaryAction, SecondaryAction);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="text">The text to display for the link.</param>
        /// <param name="tooltip">The tooltip text to display on hover.</param>
        /// <param name="icon">The icon to display alongside the link.</param>
        /// <param name="color">The color to apply to the link text.</param>
        /// <param name="uri">The URI to navigate to when the link is clicked.</param>
        /// <param name="target">The target specifying where to open the linked document.</param>
        /// <param name="primaryAction">The primary action to apply to the link, typically triggered by a click.</param>
        /// <param name="secondaryAction">The secondary action to apply to the link, typically triggered by a double-click.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, string text, string tooltip, IIcon icon, TypeColorText color, IUri uri, TypeTarget target, IAction primaryAction, IAction secondaryAction)
        {
            var html = new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(renderContext, text)))
            {
                Id = Id,
                Class = "wx-dropdown-item"
            }
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-image", (icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-tooltip", tooltip)
                .AddUserAttribute("data-color", color.ToClass())
                .AddUserAttribute("data-uri", uri?.ToString())
                .AddUserAttribute("data-target", target.ToValue());

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
