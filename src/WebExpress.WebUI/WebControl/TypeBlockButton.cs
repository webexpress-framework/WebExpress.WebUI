namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Whether a button is shown as a normal inline button or as a full-width block button.
    /// </summary>
    public enum TypeBlockButton
    {
        /// <summary>
        /// No block button.
        /// </summary>
        None,

        /// <summary>
        /// Block button that spans the entire width.
        /// </summary>
        Block
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeBlockButton"/> enum.
    /// </summary>
    public static class TypeBlockButtonExtensions
    {
        /// <summary>
        /// Converts the block button type to a corresponding CSS class.
        /// </summary>
        /// <param name="block">The block button type to convert.</param>
        /// <returns>The CSS class corresponding to the block button type.</returns>
        public static string ToClass(this TypeBlockButton block)
        {
            return block switch
            {
                TypeBlockButton.Block => "btn-block",
                _ => string.Empty,
            };
        }
    }
}
