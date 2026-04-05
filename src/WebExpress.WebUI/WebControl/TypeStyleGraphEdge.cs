namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the style of edges used in a type graph visualization.
    /// </summary>
    public enum TypeStyleGraphEdge
    {
        /// <summary>
        /// Gets the default edge style.
        /// </summary>
        Default,

        /// <summary>
        /// Draws edges as straight line segments.
        /// </summary>
        Straight,

        /// <summary>
        /// Draws edges using smooth Bézier curves.
        /// </summary>
        Smooth
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeStyleGraphEdge"/> enumeration.
    /// </summary>
    public static class TypeGraphEdgeStyleExtensions
    {
        /// <summary>
        /// Converts the TypeStyleGraphEdge to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The TypeStyleGraphEdge to be converted.</param>
        /// <returns>The data value corresponding to the TypeStyleGraphEdge.</returns>
        public static string ToValue(this TypeStyleGraphEdge layout)
        {
            return layout switch
            {
                TypeStyleGraphEdge.Straight => "straight",
                TypeStyleGraphEdge.Smooth => "smooth",
                _ => string.Empty,
            };
        }
    }
}
