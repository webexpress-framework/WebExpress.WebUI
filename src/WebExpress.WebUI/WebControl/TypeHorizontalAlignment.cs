namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Places a control at the left or right edge of its container. Through <c>ToClass</c> the
    /// control is floated there, so the following content flows around it; a few controls read the
    /// value for a part of their own instead, such as a split button aligning its menu to the right
    /// edge. There is no centered option, since an element cannot float to the middle.
    /// </summary>
    public enum TypeHorizontalAlignment
    {
        /// <summary>
        /// The control keeps its place in the normal flow.
        /// </summary>
        Default,

        /// <summary>
        /// The control is placed at the left edge, with the following content flowing around its right side.
        /// </summary>
        Left,

        /// <summary>
        /// The control is placed at the right edge, with the following content flowing around its left side.
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
