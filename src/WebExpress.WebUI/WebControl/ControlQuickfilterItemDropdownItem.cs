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
    /// A single selectable option inside a quick-filter dropdown. Each option is a
    /// filter trigger; selecting it activates its filter, typically within an
    /// exclusive group so the dropdown behaves like a single-choice picker.
    /// </summary>
    public class ControlQuickfilterItemDropdownItem
    {
        /// <summary>
        /// Gets the id of the option, which is also the filter id.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets or sets the option text.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the option icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the badge text shown at the trailing edge of the option,
        /// for example the number of matching entries. When null or empty no
        /// badge is rendered.
        /// </summary>
        public Func<IRenderControlContext, string> Badge { get; set; }

        /// <summary>
        /// Gets or sets the badge background color. The resolved css class and
        /// inline style are emitted alongside the badge text so the client can
        /// style the badge consistently with the framework badge colors.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackgroundBadge> BadgeColor { get; set; }

        /// <summary>
        /// Gets or sets the primary action, typically the filter activated when the
        /// option is selected.
        /// </summary>
        public Func<IRenderControlContext, IAction> PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action.
        /// </summary>
        public Func<IRenderControlContext, IAction> SecondaryAction { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the option.</param>
        public ControlQuickfilterItemDropdownItem(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Converts the option to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered option.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var text = I18N.Translate(renderContext, Text?.Invoke(renderContext));
            var icon = Icon?.Invoke(renderContext);
            var badge = I18N.Translate(renderContext, Badge?.Invoke(renderContext));
            var badgeColor = BadgeColor?.Invoke(renderContext);
            var primaryAction = PrimaryAction?.Invoke(renderContext);
            var secondaryAction = SecondaryAction?.Invoke(renderContext);

            var html = new HtmlElementFieldButton(new HtmlText(text))
            {
                Id = Id,
                Type = "button",
                Class = Css.Concatenate("wx-quickfilter-dropdown-option")
            }
                .AddUserAttribute("data-text", text)
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-image", (icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-badge", badge)
                .AddUserAttribute("data-badge-color", badgeColor?.ToClass())
                .AddUserAttribute("data-badge-style", badgeColor?.ToStyle());

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
