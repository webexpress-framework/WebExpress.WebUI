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
        /// Gets or sets the icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets a tooltip text.
        /// </summary>
        public Func<IRenderControlContext, string> Tooltip { get; set; }

        /// <summary>
        /// Gets or sets the identifier for the splitter.
        /// </summary>
        public Func<IRenderControlContext, string> SpltterId { get; set; }

        /// <summary>
        /// Gets or sets the link color.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorText> Color { get; set; }

        /// <summary>
        /// Gets or sets the alignment of the toolbar item.
        /// </summary>
        public Func<IRenderControlContext, TypeToolbarItemAlignment> Alignment { get; set; } = _ => TypeToolbarItemAlignment.Default;

        /// <summary>
        /// Gets the overflow behavior of the toolbar item.
        /// </summary>
        public Func<IRenderControlContext, TypeToolbarItemOverflow> Overflow { get; set; } = _ => TypeToolbarItemOverflow.Default;

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
            var icon = Icon?.Invoke(renderContext);
            var image = Image?.Invoke(renderContext);
            var tooltip = Tooltip?.Invoke(renderContext);
            var splitterId = SpltterId?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-toolbar-button wx-webui-button-split-toggle"
            }
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-image", image?.ToString() ?? (icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-title", I18N.Translate(renderContext, tooltip))
                .AddUserAttribute("data-color-css", color?.ToClass())
                .AddUserAttribute("data-color-style", color?.ToStyle())
                .AddUserAttribute("data-align", (Alignment?.Invoke(renderContext) ?? TypeToolbarItemAlignment.Default).ToValue())
                .AddUserAttribute("data-overflow", (Overflow?.Invoke(renderContext) ?? TypeToolbarItemOverflow.Default).ToValue())
                .AddUserAttribute("data-wx-primary-action", "split")
                .AddUserAttribute
                (
                    "data-wx-primary-target",
                    !string.IsNullOrWhiteSpace(splitterId)
                        ? $"#{splitterId}"
                        : null
                );
        }
    }
}
