using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text.Json;
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
        private readonly List<Point> _waypoints = [];

        /// <summary>
        /// Gets the unique identifier of the edge.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets or sets the id of the source node.
        /// </summary>
        public Func<IRenderControlContext, string> Source { get; set; }

        /// <summary>
        /// Gets or sets the id of the target node.
        /// </summary>
        public Func<IRenderControlContext, string> Target { get; set; }

        /// <summary>
        /// Gets or sets an optional label for the edge.
        /// </summary>
        public Func<IRenderControlContext, string> Label { get; set; }

        /// <summary>
        /// Gets or sets the color for the edge.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorGraph> Color { get; set; }

        /// <summary>
        /// Returns the collection of waypoints that define the path.
        /// </summary>
        public IEnumerable<Point> Waypoints => _waypoints;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlGraphItemEdge(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Adds one or more waypoints to the edge.
        /// </summary>
        /// <param name="waypoints">
        /// An array of points representing the waypoints to add.
        /// </param>
        /// <returns>
        /// The current instance with the added waypoints.
        /// </returns>
        public IControlGraphItemEdge Add(params Point[] waypoints)
        {
            _waypoints.AddRange(waypoints);

            return this;
        }

        /// <summary>
        /// Adds one or more waypoints to the edge.
        /// </summary>
        /// <param name="waypoints">
        /// An array of points representing the waypoints to add.
        /// </param>
        /// <returns>
        /// The current instance with the added waypoints.
        /// </returns>
        public IControlGraphItemEdge Add(IEnumerable<Point> waypoints)
        {
            _waypoints.AddRange(waypoints);

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var waypoints = JsonSerializer.Serialize(_waypoints.Select(p => new { x = p.X, y = p.Y }));
            var label = Label?.Invoke(renderContext);
            var source = Source?.Invoke(renderContext);
            var target = Target?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-graph-edge"
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, label))
                .AddUserAttribute("data-from", source)
                .AddUserAttribute("data-to", target)
                .AddUserAttribute("data-color-css", color?.ToClass())
                .AddUserAttribute("data-color", color?.ToStyle())
                .AddUserAttribute("data-waypoints", _waypoints.Count > 0 ? waypoints : null);
        }
    }
}
