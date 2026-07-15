using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A single one-click filter button within a quick-filter bar.
    /// </summary>
    public class ControlQuickfilterItemButton : IControlQuickfilterItem
    {
        /// <summary>
        /// Gets the id of the control.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets or sets the chip color. A system color is emitted as its button
        /// css class, a user-defined color as a raw css color value; the client
        /// keeps the outline-to-filled chip behavior in that hue.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorButton> BackgroundColor { get; set; }

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a
        /// click to open a modal or similar target.
        /// </summary>
        public Func<IRenderControlContext, IAction> PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a
        /// double-click to open a modal or similar target.
        /// </summary>
        public Func<IRenderControlContext, IAction> SecondaryAction { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the badge text shown at the trailing edge of the button,
        /// for example the number of matching entries. When null or empty no
        /// badge is rendered, so a filter without a count stays visually
        /// unchanged.
        /// </summary>
        public Func<IRenderControlContext, string> Badge { get; set; }

        /// <summary>
        /// Gets or sets the badge background color. The resolved css class and
        /// inline style are emitted alongside the badge text so the client can
        /// style the badge consistently with the framework badge colors.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackgroundBadge> BadgeColor { get; set; }

        /// <summary>
        /// Gets or sets the activation status of the button.
        /// </summary>
        public Func<IRenderControlContext, TypeActive> Active { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlQuickfilterItemButton(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var text = Text?.Invoke(renderContext);
            var icon = Icon?.Invoke(renderContext);
            var badge = Badge?.Invoke(renderContext);
            var badgeColor = BadgeColor?.Invoke(renderContext);
            var backgroundColor = BackgroundColor?.Invoke(renderContext);
            var active = Active?.Invoke(renderContext) ?? TypeActive.None;
            var primaryAction = PrimaryAction?.Invoke(renderContext);
            var secondaryAction = SecondaryAction?.Invoke(renderContext);

            var html = new HtmlElementFieldButton(new HtmlText(I18N.Translate(renderContext, text)))
            {
                Id = Id,
                Type = "button",
                Class = Css.Concatenate("wx-quickfilter-button"),
                Disabled = active == TypeActive.Disabled
            }
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-image", (icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color", backgroundColor?.ToClass())
                .AddUserAttribute("data-color-value", backgroundColor?.UserColor)
                .AddUserAttribute("data-badge", I18N.Translate(renderContext, badge))
                .AddUserAttribute("data-badge-color", badgeColor?.ToClass())
                .AddUserAttribute("data-badge-style", badgeColor?.ToStyle());

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
