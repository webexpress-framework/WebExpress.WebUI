namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a visual component capable of displaying a graph consisting of 
    /// nodes and edges.
    /// </summary>
    public interface IControlGraphItemEdge : IControlGraphItem
    {
        /// <summary>
        /// Returns the id of the source node.
        /// </summary>
        string Source { get; }

        /// <summary>
        /// Returns the id of the target node.
        /// </summary>
        string Target { get; }

        /// <summary>
        /// Returns an optional label for the edge.
        /// </summary>
        string Label { get; }

        /// <summary>
        /// Returns the color for the node.
        /// </summary>
        PropertyColorGraph Color { get; }
    }
}
