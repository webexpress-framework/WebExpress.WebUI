namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Whether a split layout is divided horizontally or vertically.
    /// </summary>
    public enum TypeOrientationSplit
    {
        /// <summary>
        /// The layout is split horizontally.
        /// </summary>
        Horizontal,

        /// <summary>
        /// The layout is split vertically.
        /// </summary>
        Vertical
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeOrientationSplit"/> enumeration.
    /// </summary>
    public static class TypeOrientationSplitExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeOrientationSplit"/> value to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The CSS class corresponding to the layout.</returns>
        public static string ToClass(this TypeOrientationSplit layout)
        {
            return layout switch
            {
                TypeOrientationSplit.Vertical => "flex-column",
                _ => string.Empty,
            };
        }
    }
}
