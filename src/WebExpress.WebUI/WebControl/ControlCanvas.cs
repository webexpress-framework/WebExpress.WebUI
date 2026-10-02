using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Renders an empty HTML <c>&lt;canvas&gt;</c> drawing surface for client-side script to paint on.
    /// The control holds no child controls; whatever appears on the canvas is drawn by script that
    /// addresses it through its id.
    /// </summary>
    public class ControlCanvas : Control
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id.</param>
        public ControlCanvas(string id = null)
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
            var role = Role?.Invoke(renderContext);

            return new HtmlElementScriptingCanvas()
            {
                Id = Id,
                Class = Css.Concatenate("wx-canvas", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = role
            };
        }
    }
}
