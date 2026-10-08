namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// How the tabs of a tab control are aligned horizontally.
    /// </summary>
    public enum TypeHorizontalAlignmentTab
    {
        /// <summary>
        /// Default alignment.
        /// </summary>
        Default,

        /// <summary>
        /// Align to the left.
        /// </summary>
        Left,

        /// <summary>
        /// Align to the center.
        /// </summary>
        Center,

        /// <summary>
        /// Align to the right.
        /// </summary>
        Right
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeHorizontalAlignmentTab"/> enum.
    /// </summary>
    public static class TypeHorizontalAlignmentTabExtensions
    {
        /// <summary>
        /// Converts the alignment to a CSS class.
        /// </summary>
        /// <param name="alignment">The alignment to be converted.</param>
        /// <returns>The CSS class corresponding to the alignment.</returns>
        public static string ToClass(this TypeHorizontalAlignmentTab alignment)
        {
            return alignment switch
            {
                TypeHorizontalAlignmentTab.Center => "justify-content-center",
                TypeHorizontalAlignmentTab.Right => "justify-content-end",
                _ => string.Empty,
            };
        }
    }
}
