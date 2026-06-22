namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// How content is aligned horizontally (left, center, or right) within its container.
    /// </summary>
    public enum TypeHorizontalAlignment
    {
        /// <summary>
        /// The default alignment.
        /// </summary>
        Default,

        /// <summary>
        /// Align to the left.
        /// </summary>
        Left,

        /// <summary>
        /// Align to the right.
        /// </summary>
        Right
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeHorizontalAlignment"/> enum.
    /// </summary>
    public static class TypesHorizontalAlignmentExtensions
    {
        /// <summary>
        /// Converts the horizontal alignment to a CSS class.
        /// </summary>
        /// <param name="alignment">The alignment to be converted.</param>
        /// <returns>The CSS class corresponding to the alignment.</returns>
        public static string ToClass(this TypeHorizontalAlignment alignment)
        {
            return alignment switch
            {
                TypeHorizontalAlignment.Left => "float-left",
                TypeHorizontalAlignment.Right => "float-right",
                _ => string.Empty,
            };
        }
    }
}
