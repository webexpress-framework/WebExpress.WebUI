namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the style options for displaying a node in a type graph visualization.
    /// </summary>
    public enum TypeStyleGraphNode
    {
        /// <summary>
        /// Gets the default value for the type parameter.
        /// </summary>
        Default,

        /// <summary>
        /// Specifies that the label is displayed inside the associated element.
        /// </summary>
        LabelInside,

        /// <summary>
        /// Specifies that the label is displayed below the associated element.
        /// </summary>
        LabelBelow
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeStyleGraphNode"/> enumeration.
    /// </summary>
    public static class TypeGraphNodeStyleExtensions
    {
        /// <summary>
        /// Converts the TypeStyleGraphNode to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The TypeStyleGraphNode to be converted.</param>
        /// <returns>The data value corresponding to the TypeStyleGraphNode.</returns>
        public static string ToValue(this TypeStyleGraphNode layout)
        {
            return layout switch
            {
                TypeStyleGraphNode.LabelBelow => "label-below",
                _ => string.Empty,
            };
        }
    }
}
