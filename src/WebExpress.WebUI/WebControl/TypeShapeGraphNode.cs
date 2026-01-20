namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the available node styles for representing type shapes in a graph visualization.
    /// </summary>
    public enum TypeShapeGraphNode
    {
        /// <summary>
        /// Gets the default shape style.
        /// </summary>
        Default,

        /// <summary>
        /// Represents a rectangle.
        /// </summary>
        Rect,

        /// <summary>
        /// Represents a geometric circle.
        /// </summary>
        Circle
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeShapeGraphNode"/> enumeration.
    /// </summary>
    public static class TypeShapeGraphNodeExtensions
    {
        /// <summary>
        /// Converts the TypeShapeGraphNode to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The TypeShapeGraphNode to be converted.</param>
        /// <returns>The data value corresponding to the TypeShapeGraphNode.</returns>
        public static string ToValue(this TypeShapeGraphNode layout)
        {
            return layout switch
            {
                TypeShapeGraphNode.Rect => "rect",
                TypeShapeGraphNode.Circle => "circle",
                _ => string.Empty,
            };
        }
    }
}
