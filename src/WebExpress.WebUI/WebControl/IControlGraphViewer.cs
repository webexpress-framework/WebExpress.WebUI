using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a visual component capable of displaying a graph consisting of 
    /// nodes and edges.
    /// </summary>
    public interface IControlGraphViewer : IControl
    {
        /// <summary>
        /// Returns the collection of nodes displayed in the graph.
        /// </summary>
        IEnumerable<IControlGraphItemNode> Nodes { get; }

        /// <summary>
        /// Returns the collection of edges displayed in the graph.
        /// </summary>
        IEnumerable<IControlGraphItemEdge> Edges { get; }

        /// <summary>
        /// Returns the style used to render nodes the type graph.
        /// </summary>
        TypeStyleGraphNode NodeStyle { get; }

        /// <summary>
        /// Returns the style used to render edges in the type graph.
        /// </summary>
        TypeStyleGraphEdge EdgeStyle { get; }

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
        IControlGraphViewer Add(params IControlGraphItemNode[] nodes);

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
        IControlGraphViewer Add(params IControlGraphItemEdge[] edges);
    }
}
