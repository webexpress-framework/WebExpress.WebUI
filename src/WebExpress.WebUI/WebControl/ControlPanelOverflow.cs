using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a specialized control panel that supports overflow behavior for its child controls.
    /// </summary>
    public class ControlPanelOverflow : ControlPanel
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="controls">The child controls to be added to the panel.</param>
        public ControlPanelOverflow(string id = null, params ControlAlert[] controls)
            : base(id, controls)
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
            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-overflow", GetClasses()),
                Style = GetStyles(),
                DataTheme = Theme.ToValue()
            }
                .Add(Content.Select(x => x.Render(renderContext, visualTree)));
        }
    }
}
