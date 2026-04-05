using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a toolbar item that toggles between compact and expanded views of a split control side pane.
    /// </summary>
    /// <remarks>
    /// This control allows users to switch the side pane between a reduced (compact) and normal 
    /// (full) layout mode, enabling adaptive UI behavior based on context or user preference.
    /// </remarks>
    public class ControlToolbarItemButtonSplitToggle : IControlToolbarItem
    {
        private readonly string _id;

        /// <summary>
        /// Returns the unique identifier for the entity.
        /// </summary>
        public string Id => _id;

        /// <summary>
        /// Returns or sets the icon.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Returns or sets a tooltip text.
        /// </summary>
        public string Tooltip { get; set; }

        /// <summary>
        /// Returns or sets the identifier for the splitter.
        /// </summary>
        public string SpltterId { get; set; }

        /// <summary>
        /// Returns or sets the link color.
        /// </summary>
        public PropertyColorText Color { get; set; }

        /// <summary>
        /// Returns or sets the alignment of the toolbar item.
        /// </summary>
        public TypeToolbarItemAlignment Alignment { get; set; } = TypeToolbarItemAlignment.Default;

        /// <summary>
        /// Returns the overflow behavior of the toolbar item.
        /// </summary>
        public TypeToolbarItemOverflow Overflow { get; set; } = TypeToolbarItemOverflow.Default;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlToolbarItemButtonSplitToggle(string id = null)
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
            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-toolbar-button wx-webui-button-split-toggle"
            }
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", (Icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-title", I18N.Translate(renderContext, Tooltip))
                .AddUserAttribute("data-color-css", Color?.ToClass())
                .AddUserAttribute("data-color-style", Color?.ToStyle())
                .AddUserAttribute("data-align", Alignment.ToValue())
                .AddUserAttribute("data-overflow", Overflow.ToValue())
                .AddUserAttribute("data-wx-primary-action", "split")
                .AddUserAttribute
                (
                    "data-wx-primary-target",
                    !string.IsNullOrWhiteSpace(SpltterId)
                        ? $"#{SpltterId}"
                        : null
                );
        }
    }
}
