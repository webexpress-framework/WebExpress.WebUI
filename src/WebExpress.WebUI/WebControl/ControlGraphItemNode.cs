using System;
using System.Drawing;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
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
        /// Gets the unique identifier of the node.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets or sets an optional label for the node.
        /// </summary>
        public Func<IRenderControlContext, string> Label { get; set; }

        /// <summary>
        /// Gets or sets the URI associated with the resource.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the coordinates of the point for the node.
        /// </summary>
        public Func<IRenderControlContext, Point?> Point { get; set; }

        /// <summary>
        /// Gets or sets the color for the node.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorGraph> Color { get; set; }

        /// <summary>
        /// Gets or sets the background color for the node.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackgroundGraph> BackgroundColor { get; set; }

        /// <summary>
        /// Gets or sets the shape type associated with this node.
        /// </summary>
        public Func<IRenderControlContext, TypeShapeGraphNode> Shape { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with this node.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

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
            var label = Label?.Invoke(renderContext);
            var uri = Uri?.Invoke(renderContext);
            var icon = Icon?.Invoke(renderContext);
            var image = Image?.Invoke(renderContext);
            var point = Point?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);
            var backgroundColor = BackgroundColor?.Invoke(renderContext);
            var shape = Shape?.Invoke(renderContext) ?? TypeShapeGraphNode.Default;

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-graph-node"
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, label))
                .AddUserAttribute("data-uri", uri?.ToString())
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-image", image?.ToString() ?? (icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-x", point.HasValue ? point.Value.X.ToString() : null)
                .AddUserAttribute("data-y", point.HasValue ? point.Value.Y.ToString() : null)
                .AddUserAttribute("data-foreground-css", color?.ToClass())
                .AddUserAttribute("data-foreground-color", color?.ToStyle())
                .AddUserAttribute("data-background-css", backgroundColor?.ToClass())
                .AddUserAttribute("data-background-color", backgroundColor?.ToStyle())
                .AddUserAttribute("data-shape", shape != TypeShapeGraphNode.Default ? shape.ToValue() : null);
        }
    }
}
