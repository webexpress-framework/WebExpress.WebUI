using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a visual component capable of displaying a graph consisting of 
    /// nodes and edges.
    /// </summary>
    public class ControlGraphItemEdge : IControlGraphItemEdge
    {
        /// <summary>
        /// Returns the unique identifier of the edge.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Returns or sets the id of the source node.
        /// </summary>
        public string Source { get; set; }

        /// <summary>
        /// Returns or sets the id of the target node.
        /// </summary>
        public string Target { get; set; }

        /// <summary>
        /// Returns or sets an optional label for the edge.
        /// </summary>
        public string Label { get; set; }

        /// <summary>
        /// Returns or sets the color for the edge.
        /// </summary>
        public PropertyColorGraph Color { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlGraphItemEdge(string id = null)
        {
            Id = id;
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
                Class = "wx-graph-edge"
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Label))
                .AddUserAttribute("data-from", Source)
                .AddUserAttribute("data-to", Target)
                .AddUserAttribute("data-color-css", Color is not null
                    ? Color.ToClass()
                    : null)
                .AddUserAttribute("data-color", Color is not null
                    ? Color.ToStyle()
                    : null);
        }
    }
}
