using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a button in a quickfilter control.
    /// </summary>
    public class ControlQuickfilterItemButton : IControlQuickfilterItem
    {
        /// <summary>
        /// Returns the id of the control.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets or sets the color.
        /// </summary>
        public PropertyColorButton BackgroundColor { get; set; }

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public string Text { get; set; }

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
        /// Gets or sets the activation status of the button.
        /// </summary>
        public TypeActive Active { get; set; }

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
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementFieldButton(new HtmlText(I18N.Translate(renderContext, Text)))
            {
                Id = Id,
                Type = "button",
                Class = Css.Concatenate("wx-quickfilter-button"),
                Disabled = Active == TypeActive.Disabled
            }
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", (Icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color", BackgroundColor?.SystemColor.ToString());

            PrimaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            SecondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
