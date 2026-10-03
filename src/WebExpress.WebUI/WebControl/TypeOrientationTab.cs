namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Whether a tab control's tabs are arranged horizontally or vertically.
    /// </summary>
    public enum TypeOrientationTab
    {
        /// <summary>
        /// The default orientation.
        /// </summary>
        Default,

        /// <summary>
        /// The horizontal orientation.
        /// </summary>
        Horizontal,

        /// <summary>
        /// The vertical orientation.
        /// </summary>
        Vertical
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeOrientationTab"/> enumeration.
    /// </summary>
    public static class TypeOrientationTabExtensions
    {
        /// <summary>
        /// Converts the specified layout to a CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The CSS class corresponding to the layout.</returns>
        public static string ToClass(this TypeOrientationTab layout)
        {
            return layout switch
            {
                TypeOrientationTab.Vertical => "flex-column",
                _ => string.Empty,
            };
        }
    }
}
