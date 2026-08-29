namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies how a line is drawn. A dashed or dotted rule reads as a weaker
    /// separation than a solid one, which is what makes it the right choice for
    /// a break inside a group rather than between groups.
    /// </summary>
    public enum TypeStyleLine
    {
        /// <summary>
        /// Represents the default behavior, which is the solid rule of the theme.
        /// </summary>
        Default,

        /// <summary>
        /// Represents a solid line, stated explicitly.
        /// </summary>
        Solid,

        /// <summary>
        /// Represents a dashed line.
        /// </summary>
        Dashed,

        /// <summary>
        /// Represents a dotted line.
        /// </summary>
        Dotted
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeStyleLine"/> enum.
    /// </summary>
    public static class TypeStyleLineExtensions
    {
        /// <summary>
        /// Converts the line style to a CSS class.
        /// </summary>
        /// <param name="style">The line style to be converted.</param>
        /// <returns>The CSS class corresponding to the line style, or an empty string for the default.</returns>
        public static string ToClass(this TypeStyleLine style)
        {
            return style switch
            {
                TypeStyleLine.Solid => "wx-line-solid",
                TypeStyleLine.Dashed => "wx-line-dashed",
                TypeStyleLine.Dotted => "wx-line-dotted",
                _ => string.Empty,
            };
        }
    }
}
