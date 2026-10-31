using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A chip within a quick-filter bar that creates a new filter instead of
    /// applying one. It carries no filter id and never shows active; its action -
    /// typically a modal offering the filter criteria - is what defines the new
    /// filter. The client places it at the trailing edge of the bar, so the
    /// affordance keeps its position while filters come and go.
    /// </summary>
    public class ControlQuickfilterItemAdd : IControlQuickfilterItem
    {
        /// <summary>
        /// Gets the id of the control.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets or sets the text. When omitted the chip shows the icon alone,
        /// which keeps a crowded bar compact.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the tooltip, which names the action for an icon-only chip.
        /// </summary>
        public Func<IRenderControlContext, string> Tooltip { get; set; }

        /// <summary>
        /// Gets or sets the icon. When omitted a plus icon is used, because the
        /// chip is recognized by that sign rather than by its label.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the primary action, typically an <see cref="ActionModal"/>
        /// opening the application's filter dialog. What a filter selects is the
        /// application's business, so the framework ships no editor for it.
        /// </summary>
        public Func<IRenderControlContext, IAction> PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a
        /// double-click.
        /// </summary>
        public Func<IRenderControlContext, IAction> SecondaryAction { get; set; }

        /// <summary>
        /// Gets or sets the activation status of the chip.
        /// </summary>
        public Func<IRenderControlContext, TypeActive> Active { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlQuickfilterItemAdd(string id = null)
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
            var tooltip = I18N.Translate(renderContext, Tooltip?.Invoke(renderContext));
            var icon = Icon?.Invoke(renderContext) ?? new IconPlus();
            var active = Active?.Invoke(renderContext) ?? TypeActive.None;
            var primaryAction = PrimaryAction?.Invoke(renderContext);
            var secondaryAction = SecondaryAction?.Invoke(renderContext);

            var html = new HtmlElementFieldButton(new HtmlText(text))
            {
                Id = Id,
                Type = "button",
                Class = Css.Concatenate("wx-quickfilter-add"),
                Title = tooltip,
                Disabled = active == TypeActive.Disabled
            }
                .AddUserAttribute("data-text", text)
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-image", (icon as ImageIcon)?.Uri?.ToString());

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
