using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a footer control panel that can contain multiple child controls and
    /// manage their layout and rendering.
    /// </summary>
    public class ControlFooter : ControlPanel
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The content of the html element.</param>
        public ControlFooter(string id = null, params IControl[] content)
            : base(id, content)
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
            var role = Role?.Invoke(renderContext);

            var html = new HtmlElementSectionFooter([.. Content.Select(x => x.Render(renderContext, visualTree))])
            {
                Id = Id,
                Class = GetClasses(renderContext),
                Style = GetStyles(renderContext),
                Role = role
            };
            html.AddUserAttribute("data-wx-theme", Theme?.Invoke(renderContext).ToValue());
            return html;
        }
    }
}
