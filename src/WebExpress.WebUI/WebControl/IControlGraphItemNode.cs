using System.Drawing;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a node within a control graph, providing identification and labeling 
    /// for UI elements rendered in a visual tree.
    /// </summary>
    public interface IControlGraphItemNode : IControlGraphItem
    {
        /// <summary>
        /// Returns or sets an optional label for the node.
        /// </summary>
        string Label { get; }

        /// <summary>
        /// Returns the coordinates of the point for the node.
        /// </summary>
        Point Point { get; }

        /// <summary>
        /// Returns or sets the color for the node.
        /// </summary>
        PropertyColorGraph Color { get; }

        /// <summary>
        /// Returns the background color for the node.
        /// </summary>
        PropertyColorBackgroundGraph BackgroundColor { get; }
    }
}
