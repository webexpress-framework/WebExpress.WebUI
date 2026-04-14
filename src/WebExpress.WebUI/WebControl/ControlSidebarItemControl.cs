using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a sidebar item panel control.
    /// </summary>
    /// <remarks>
    /// This class is used to create a panel within a sidebar.
    /// </remarks>
    public class ControlSidebarItemControl : IControlSidebarItem
    {
        private readonly string _id;

        /// <summary>
        /// Returns the unique identifier for the entity.
        /// </summary>
        public string Id => _id;

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
        public PropertyColorText Color { get; set; }

        /// <summary>
        /// Gets or sets the content to be displayed within the control.
        /// </summary>
        public IControl Content { get; set; }

        /// <summary>
        /// Gets or sets the mode of the type sidebar, which determines its behavior.
        /// </summary>
        public virtual TypeSidebarModeExtended Mode { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlSidebarItemControl(string id = null)
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
                Class = "wx-sidebar-control"
            }
                .AddUserAttribute("data-mode", Mode != TypeSidebarModeExtended.Default ? Mode.ToData() : null)
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", (Icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-title", I18N.Translate(renderContext, Tooltip))
                .AddUserAttribute("data-color-css", Color?.ToClass())
                .AddUserAttribute("data-color-style", Color?.ToStyle())
                .Add(Content?.Render(renderContext, visualTree));
        }
    }
}
