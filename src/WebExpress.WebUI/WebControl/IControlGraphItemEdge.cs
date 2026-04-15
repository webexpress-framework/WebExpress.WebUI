using System.Collections.Generic;
using System.Drawing;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a visual component capable of displaying a graph consisting of 
    /// nodes and edges.
    /// </summary>
    public interface IControlGraphItemEdge : IControlGraphItem
    {
        /// <summary>
        /// Gets the id of the source node.
        /// </summary>
        string Source { get; }

        /// <summary>
        /// Gets the id of the target node.
        /// </summary>
        string Target { get; }

        /// <summary>
        /// Gets an optional label for the edge.
        /// </summary>
        string Label { get; }

        /// <summary>
        /// Gets the color for the node.
        /// </summary>
        PropertyColorGraph Color { get; }

        /// <summary>
        /// Gets the collection of waypoints that define the path.
        /// </summary>
        IEnumerable<Point> Waypoints { get; }

        /// <summary>
        /// Adds one or more waypoints to the edge.
        /// </summary>
        /// <param name="waypoints">
        /// An array of points representing the waypoints to add.
        /// </param>
        /// <returns>
        /// The current instance with the added waypoints.
        /// </returns>
        IControlGraphItemEdge Add(params Point[] waypoints);

        /// <summary>
        /// Adds one or more waypoints to the edge.
        /// </summary>
        /// <param name="waypoints">
        /// An array of points representing the waypoints to add.
        /// </param>
        /// <returns>
        /// The current instance with the added waypoints.
        /// </returns>
        IControlGraphItemEdge Add(IEnumerable<Point> waypoints);
    }
}
