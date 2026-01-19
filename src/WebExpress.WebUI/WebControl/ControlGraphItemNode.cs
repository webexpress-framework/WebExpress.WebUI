using System.Drawing;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a node within a control graph, providing identification and labeling 
    /// for UI elements rendered in a visual tree.
    /// </summary>
    public class ControlGraphItemNode : IControlGraphItemNode
    {
        /// <summary>
        /// Returns the unique identifier of the node.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Returns or sets an optional label for the node.
        /// </summary>
        public string Label { get; set; }

        /// <summary>
        /// Returns or sets the coordinates of the point for the node.
        /// </summary>
        public Point Point { get; set; }

        /// <summary>
        /// Returns or sets the color for the node.
        /// </summary>
        public PropertyColorGraph Color { get; set; }

        /// <summary>
        /// Returns or sets the background color for the node.
        /// </summary>
        public PropertyColorBackgroundGraph BackgroundColor { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlGraphItemNode(string id = null)
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
                Class = "wx-graph-node"
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Label))
                .AddUserAttribute("data-x", Point.X.ToString())
                .AddUserAttribute("data-y", Point.Y.ToString())
                .AddUserAttribute("data-foreground-css", Color?.ToClass())
                .AddUserAttribute("data-foreground-color", Color?.ToStyle())
                .AddUserAttribute("data-background-css", BackgroundColor?.ToClass())
                .AddUserAttribute("data-background-color", BackgroundColor?.ToStyle());
        }
    }
}
