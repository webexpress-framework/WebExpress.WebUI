namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the alignment options for toolbar items.
    /// </summary>
    public enum TypeToolbarItemAlignment
    {
        /// <summary>
        /// Default alignment.
        /// </summary>
        Default,

        /// <summary>
        /// Represents a alignment to the left.
        /// </summary>
        Left,

        /// <summary>
        /// Represents a alignment to the right.
        /// </summary>
        Right
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeToolbarItemAlignment"/> enum.
    /// </summary>
    public static class TypeToolbarItemAlignmentExtensions
    {
        /// <summary>
        /// Converts the specified value to its corresponding string
        /// representation.
        /// </summary>
        /// <param name="alignment">The value to convert.</param>
        /// <returns>A string that represents the alignment.</returns>
        public static string ToValue(this TypeToolbarItemAlignment alignment)
        {
            return alignment switch
            {
                TypeToolbarItemAlignment.Left => "left",
                TypeToolbarItemAlignment.Right => "right",
                _ => string.Empty,
            };
        }
    }
}
