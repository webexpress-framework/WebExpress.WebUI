using System;
using System.Collections.Generic;
using System.Drawing;
using WebExpress.WebUI.WebPage;

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
        Func<IRenderControlContext, string> Source { get; }

        /// <summary>
        /// Gets the id of the target node.
        /// </summary>
        Func<IRenderControlContext, string> Target { get; }

        /// <summary>
        /// Gets an optional label for the edge.
        /// </summary>
        Func<IRenderControlContext, string> Label { get; }

        /// <summary>
        /// Gets the color for the node.
        /// </summary>
        Func<IRenderControlContext, PropertyColorGraph> Color { get; }

        /// <summary>
        /// Gets the collection of waypoints that define the path.
        /// </summary>
        IEnumerable<Point> Waypoints { get; }

        /// <summary>
        /// Adds one or more waypoints to the edge.
        /// </summary>
        IControlGraphItemEdge Add(params Point[] waypoints);

        /// <summary>
        /// Adds one or more waypoints to the edge.
        /// </summary>
        IControlGraphItemEdge Add(IEnumerable<Point> waypoints);
    }
}
