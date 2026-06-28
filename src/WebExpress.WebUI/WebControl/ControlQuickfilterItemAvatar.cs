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
    /// A single avatar-based one-click filter within a quick-filter bar, used to
    /// filter by a person (or any entity with a face). The client renders the
    /// avatar from the image when one is supplied, otherwise from the initials on
    /// the person's color, matching the avatars shown elsewhere in the app.
    /// </summary>
    public class ControlQuickfilterItemAvatar : IControlQuickfilterItem
    {
        /// <summary>
        /// Gets the id of the control, which is also the filter id.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets or sets the display name, shown as the label and the tooltip.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the avatar image uri. When omitted, the initials are shown.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the short text shown inside the avatar bubble when no image
        /// is supplied. When omitted, the client derives it from the name.
        /// </summary>
        public Func<IRenderControlContext, string> Initials { get; set; }

        /// <summary>
        /// Gets or sets the avatar background color as a CSS color, used behind the
        /// initials or icon. When omitted, the stylesheet default applies.
        /// </summary>
        public Func<IRenderControlContext, string> Color { get; set; }

        /// <summary>
        /// Gets or sets the icon shown inside the avatar bubble when no image is
        /// supplied, taking precedence over the initials. Useful for a group or a
        /// role avatar that has no photo.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the primary action, typically the filter activated when the
        /// avatar is clicked.
        /// </summary>
        public Func<IRenderControlContext, IAction> PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a double-click.
        /// </summary>
        public Func<IRenderControlContext, IAction> SecondaryAction { get; set; }

        /// <summary>
        /// Gets or sets the activation status of the avatar.
        /// </summary>
        public Func<IRenderControlContext, TypeActive> Active { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlQuickfilterItemAvatar(string id = null)
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
            var text = I18N.Translate(renderContext, Text?.Invoke(renderContext));
            var image = Image?.Invoke(renderContext);
            var initials = Initials?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);
            var icon = Icon?.Invoke(renderContext);
            var active = Active?.Invoke(renderContext) ?? TypeActive.None;
            var primaryAction = PrimaryAction?.Invoke(renderContext);
            var secondaryAction = SecondaryAction?.Invoke(renderContext);

            // the text content carries the name so the filter registry picks it up
            // as the filter name; the client replaces it with the avatar visual
            var html = new HtmlElementFieldButton(new HtmlText(text))
            {
                Id = Id,
                Type = "button",
                Class = Css.Concatenate("wx-quickfilter-avatar"),
                Disabled = active == TypeActive.Disabled
            }
                .AddUserAttribute("data-name", text)
                .AddUserAttribute("data-image", image?.ToString() ?? (icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-initials", initials)
                .AddUserAttribute("data-color", color);

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
