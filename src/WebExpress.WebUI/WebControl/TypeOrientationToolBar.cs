namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Whether a toolbar is laid out horizontally or vertically.
    /// </summary>
    public enum TypeOrientationToolBar
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
    /// Provides extension methods for the <see cref="TypeOrientationToolBar"/> enum.
    /// </summary>
    public static class TypeOrientationToolBarExtensions
    {
        /// <summary>
        /// Converts the layout to a CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The CSS class corresponding to the layout.</returns>
        public static string ToClass(this TypeOrientationToolBar layout)
        {
            return layout switch
            {
                TypeOrientationToolBar.Horizontal => string.Empty,
                _ => "navbar-expand-sm",
            };
        }
    }
}
