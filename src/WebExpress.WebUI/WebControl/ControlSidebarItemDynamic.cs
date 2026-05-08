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
    /// Represents a sidebar item control that renders its content manually.
    /// </summary>
    /// <remarks>
    /// This class provides a flexible rendering mechanism for sidebar panels by allowing
    /// custom HTML output via a delegate or composed logic. It is suitable for dynamic,
    /// composite, or data-driven sidebar content.
    /// </remarks>
    public class ControlSidebarItemDynamic : IControlSidebarItem
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
        /// Gets or sets the link color.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorText> Color { get; set; }

        /// <summary>
        /// Gets or sets the delegate responsible for rendering a control into an HTML node.
        /// </summary>
        public Func<IRenderControlContext, IVisualTreeControl, IHtmlNode> RenderControl { get; set; }

        /// <summary>
        /// Gets or sets the mode of the type sidebar, which determines its behavior.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeSidebarModeExtended> Mode { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlSidebarItemDynamic(string id = null)
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
            var mode = Mode?.Invoke(renderContext) ?? TypeSidebarModeExtended.Default;
            var icon = Icon?.Invoke(renderContext);
            var image = Image?.Invoke(renderContext);
            var tooltip = Tooltip?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-sidebar-control"
            }
                .AddUserAttribute("data-mode", mode != TypeSidebarModeExtended.Default ? mode.ToData() : null)
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-image", image?.ToString() ?? (icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-title", I18N.Translate(renderContext, tooltip))
                .AddUserAttribute("data-color-css", color?.ToClass())
                .AddUserAttribute("data-color-style", color?.ToStyle())
                .Add(RenderControl?.Invoke(renderContext, visualTree));
        }
    }
}
