namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The alignment options for the dropdown menu.
    /// </summary>
    public enum TypeAlignmentDropdownMenu
    {
        /// <summary>
        /// Default alignment.
        /// </summary>
        Default,

        /// <summary>
        /// Align to the right.
        /// </summary>
        Right
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeAlignmentDropdownMenu"/> enum.
    /// </summary>
    public static class TypeAlighmentDropdownMenuExtensions
    {
        /// <summary>
        /// Converts the alignment option to a CSS class.
        /// </summary>
        /// <param name="direction">The alignment option to convert.</param>
        /// <returns>The corresponding CSS class for the alignment option.</returns>
        public static string ToClass(this TypeAlignmentDropdownMenu direction)
        {
            return direction switch
            {
                TypeAlignmentDropdownMenu.Right => "dropdown-menu-end",
                _ => string.Empty,
            };
        }
    }
}
