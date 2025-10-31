namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The possible display types.
    /// </summary>
    public enum TypeDisplay
    {
        /// <summary>
        /// No display specified.
        /// </summary>
        Default,

        /// <summary>
        /// The element is not displayed.
        /// </summary>
        None,

        /// <summary>
        /// The element is displayed as block.
        /// </summary>
        Block,

        /// <summary>
        /// The element is displayed inline.
        /// </summary>
        Inline,

        /// <summary>
        /// The element is displayed as flex container.
        /// </summary>
        Flex,

        /// <summary>
        /// The element is displayed as grid container.
        /// </summary>
        Grid
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeDisplay"/> enum.
    /// </summary>
    public static class TypeDisplayExtensions
    {
        /// <summary>
        /// Converts the display type to a Bootstrap CSS class.
        /// </summary>
        /// <param name="display">The display type to be converted.</param>
        /// <returns>The CSS class corresponding to the display type.</returns>
        public static string ToClass(this TypeDisplay display)
        {
            return display switch
            {
                TypeDisplay.None => "d-none",
                TypeDisplay.Block => "d-block",
                TypeDisplay.Inline => "d-inline",
                TypeDisplay.Flex => "d-flex",
                TypeDisplay.Grid => "d-grid",
                _ => string.Empty,
            };
        }
    }
}
