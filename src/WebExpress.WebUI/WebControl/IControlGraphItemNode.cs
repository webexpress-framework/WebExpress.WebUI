using System.Drawing;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a node within a control graph, providing identification and labeling 
    /// for UI elements rendered in a visual tree.
    /// </summary>
    public interface IControlGraphItemNode : IControlGraphItem
    {
        /// <summary>
        /// Returns the URI associated with the resource.
        /// </summary>
        IUri Uri { get; }

        /// <summary>
        /// Returns or sets an optional label for the node.
        /// </summary>
        string Label { get; }

        /// <summary>
        /// Returns the coordinates of the point for the node.
        /// </summary>
        Point? Point { get; }

        /// <summary>
        /// Returns or sets the color for the node.
        /// </summary>
        PropertyColorGraph Color { get; }

        /// <summary>
        /// Returns the background color for the node.
        /// </summary>
        PropertyColorBackgroundGraph BackgroundColor { get; }

        /// <summary>
        /// Returns the icon associated with this node.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Returns the shape type associated with this node.
        /// </summary>
        TypeShapeGraphNode Shape { get; }
    }
}
