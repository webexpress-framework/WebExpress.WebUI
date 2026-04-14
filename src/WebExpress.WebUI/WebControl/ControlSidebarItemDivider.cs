using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a sidebar item link control.
    /// </summary>
    /// <remarks>
    /// This class is used to create a link within a sidebar.
    /// </remarks>
    public class ControlSidebarItemDivider : IControlSidebarItem
    {
        private readonly string _id;

        /// <summary>
        /// Returns the unique identifier for the entity.
        /// </summary>
        public string Id => _id;

        /// <summary>
        /// Gets or sets the link color.
        /// </summary>
        public PropertyColorText Color { get; set; }

        /// <summary>
        /// Gets or sets the mode of the type sidebar, which determines its behavior.
        /// </summary>
        public virtual TypeSidebarMode Mode { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlSidebarItemDivider(string id = null)
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
                Class = "wx-sidebar-separator"
            }
                .AddUserAttribute("data-mode", Mode != TypeSidebarMode.Default ? Mode.ToData() : null)
                .AddUserAttribute("data-color-css", Color?.ToClass())
                .AddUserAttribute("data-color-style", Color?.ToStyle());
        }
    }
}
