namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// How much a flexbox item grows to fill the available space, relative to its siblings.
    /// </summary>
    public enum TypeFlexGrow
    {
        /// <summary>
        /// No flex grow.
        /// </summary>
        None,

        /// <summary>
        /// Prevents the element from growing.
        /// </summary>
        NoGrow,

        /// <summary>
        /// Allows the element to take up the available space.
        /// </summary>
        Grow
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeFlexGrow"/> enum.
    /// </summary>
    public static class TypeFlexGrowExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeFlexGrow"/> value to a corresponding CSS class.
        /// </summary>
        /// <param name="grow">The <see cref="TypeFlexGrow"/> value to be converted.</param>
        /// <returns>The CSS class corresponding to the <see cref="TypeFlexGrow"/> value.</returns>
        public static string ToClass(this TypeFlexGrow grow)
        {
            return grow switch
            {
                TypeFlexGrow.NoGrow => "flex-grow-0",
                TypeFlexGrow.Grow => "flex-grow-1",
                _ => string.Empty,
            };
        }
    }
}
