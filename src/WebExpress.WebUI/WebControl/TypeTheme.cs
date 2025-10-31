namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the available themes for the web control.
    /// </summary>
    public enum TypeTheme
    {
        /// <summary>
        /// No specific theme is applied.
        /// </summary>
        None,

        /// <summary>
        /// Represents a light theme.
        /// </summary>
        Light,

        /// <summary>
        /// Represents a dark theme.
        /// </summary>
        Dark
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeTheme"/> enum.
    /// </summary>
    public static class TypeThemeExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeTheme"/> value.
        /// </summary>
        /// <param name="layout">The <see cref="TypeTheme"/> value to be converted.</param>
        /// <returns>A string that corresponding to the <see cref="TypeTheme"/> value.</returns>
        public static string ToValue(this TypeTheme layout)
        {
            return layout switch
            {
                TypeTheme.Light => "light",
                TypeTheme.Dark => "dark",
                _ => string.Empty,
            };
        }
    }
}
