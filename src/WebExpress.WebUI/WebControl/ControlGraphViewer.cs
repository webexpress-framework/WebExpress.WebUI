using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a visual component capable of displaying a graph consisting of 
    /// nodes and edges.
    /// </summary>
    public class ControlGraphViewer : Control
    {
        private readonly List<IControlGraphItemNode> _nodes = [];
        private readonly List<IControlGraphItemEdge> _edges = [];

        /// <summary>
        /// Returns the collection of nodes displayed in the graph.
        /// </summary>
        public IEnumerable<IControlGraphItemNode> Nodes => _nodes;

        /// <summary>
        /// Returns the collection of edges displayed in the graph.
        /// </summary>
        public IEnumerable<IControlGraphItemEdge> Edges => _edges;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlGraphViewer(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Adds one or more control graph nodes to the viewer.
        /// </summary>
        /// <param name="nodes">
        /// An array of nodes to add to the control graph. Cannot be null or 
        /// contain null elements.
        /// </param>
        /// <returns>
        /// The current instance to allow method chaining.
        /// </returns>
        public ControlGraphViewer Add(params IControlGraphItemNode[] nodes)
        {
            _nodes.AddRange(nodes);

            return this;
        }

        /// <summary>
        /// Adds one or more edges to the control graph viewer.
        /// </summary>
        /// <param name="edges">
        /// An array of edges to add to the control graph. Each edge represents a connection 
        /// between nodes in the graph.
        /// </param>
        /// <returns>
        /// The current instance, enabling method chaining.
        /// </returns>
        public ControlGraphViewer Add(params IControlGraphItemEdge[] edges)
        {
            _edges.AddRange(edges);

            return this;
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
                Class = Css.Concatenate("wx-webui-graph-viewer", GetClasses()),
                Style = GetStyles(),
                Role = "region"
            }
                .Add(_nodes.Select(x => x.Render(renderContext, visualTree)))
                .Add(_edges.Select(x => x.Render(renderContext, visualTree)));
        }
    }
}
