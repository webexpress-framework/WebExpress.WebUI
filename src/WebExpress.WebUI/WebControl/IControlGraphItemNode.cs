using System;
using System.Drawing;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a node within a control graph, providing identification and labeling
    /// for UI elements rendered in a visual tree.
    /// </summary>
    public interface IControlGraphItemNode : IControlGraphItem
    {
        /// <summary>
        /// Gets the URI associated with the resource.
        /// </summary>
        Func<IRenderControlContext, IUri> Uri { get; }

        /// <summary>
        /// Gets or sets an optional label for the node.
        /// </summary>
        Func<IRenderControlContext, string> Label { get; }

        /// <summary>
        /// Gets the coordinates of the point for the node.
        /// </summary>
        Func<IRenderControlContext, Point?> Point { get; }

        /// <summary>
        /// Gets or sets the color for the node.
        /// </summary>
        Func<IRenderControlContext, PropertyColorGraph> Color { get; }

        /// <summary>
        /// Gets the background color for the node.
        /// </summary>
        Func<IRenderControlContext, PropertyColorBackgroundGraph> BackgroundColor { get; }

        /// <summary>
        /// Gets the icon associated with this node.
        /// </summary>
        Func<IRenderControlContext, IIcon> Icon { get; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets the shape type associated with this node.
        /// </summary>
        Func<IRenderControlContext, TypeShapeGraphNode> Shape { get; }
    }
}
