using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a navigation bar control panel that can contain multiple child controls.
    /// </summary>
    public class ControlPanelNavbar : ControlPanel
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The navbar items.</param>
        public ControlPanelNavbar(string id = null, params IControl[] items)
            : base(id, items)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            return new HtmlElementSectionNav([.. Content.Select(x => x.Render(renderContext, visualTree))])
            {
                Id = Id,
                Class = Css.Concatenate("navbar", GetClasses()),
                Style = GetStyles(),
                Role = Role,
                DataTheme = Theme.ToValue()
            };
        }
    }
}
