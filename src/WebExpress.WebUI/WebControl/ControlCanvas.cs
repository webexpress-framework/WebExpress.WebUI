using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a canvas control that can contain other controls.
    /// </summary>
    /// <remarks>
    /// The ControlCanvas class provides a container for other controls, allowing for the dynamic construction
    /// of user interfaces. It supports adding, removing, and rendering child controls.
    /// </remarks>
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
                Class = Css.Concatenate("", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = role
            };
        }
    }
}
