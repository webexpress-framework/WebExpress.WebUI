using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a grid control panel with 12 cells per row.
    /// </summary>
    /// <remarks>
    /// This class is a specialized version of the <see cref="ControlPanel"/> that arranges 
    /// its child controls in a grid layout with 12 cells per row.
    /// </remarks>
    public class ControlPanelGrid : ControlPanel
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlPanelGrid(string id = null)
            : base(id)
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
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = GetClasses(),
                Style = GetStyles(),
                Role = Role,
                DataTheme = Theme.ToValue()
            };

            html.Add(new HtmlElementTextContentDiv
            (
                Content.Select(x => x.Render(renderContext, visualTree)).ToArray()
            )
            {
                Class = "row"
            });

            return html;
        }
    }
}
