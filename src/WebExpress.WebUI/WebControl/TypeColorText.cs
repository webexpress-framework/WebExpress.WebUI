namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The standard text colors.
    /// </summary>
    public enum TypeColorText
    {
        /// <summary>
        /// Default color.
        /// </summary>
        Default = 0,

        /// <summary>
        /// Primary color.
        /// </summary>
        Primary = 1,

        /// <summary>
        /// Secondary color.
        /// </summary>
        Secondary = 2,

        /// <summary>
        /// Success color.
        /// </summary>
        Success = 3,

        /// <summary>
        /// Info color.
        /// </summary>
        Info = 4,

        /// <summary>
        /// Warning color.
        /// </summary>
        Warning = 5,

        /// <summary>
        /// Danger color.
        /// </summary>
        Danger = 6,

        /// <summary>
        /// Dark color.
        /// </summary>
        Dark = 7,

        /// <summary>
        /// Light color.
        /// </summary>
        Light = 8,

        /// <summary>
        /// White color.
        /// </summary>
        White = 9,

        /// <summary>
        /// Muted color.
        /// </summary>
        Muted = 11,

        /// <summary>
        /// Highlight color.
        /// </summary>
        Highlight = 13
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeColorText"/> enum.
    /// </summary>
    public static class TypeColorTextExtensions
    {
        /// <summary>
        /// Converts the color to a CSS class.
        /// </summary>
        /// <param name="color">The color to be converted.</param>
        /// <returns>The CSS class corresponding to the color.</returns>
        public static string ToClass(this TypeColorText color)
        {
            return color switch
            {
                TypeColorText.Muted => "text-muted",
                TypeColorText.Primary => "text-primary",
                TypeColorText.Secondary => "text-secondary",
                TypeColorText.Success => "text-success",
                TypeColorText.Info => "text-info",
                TypeColorText.Warning => "text-warning",
                TypeColorText.Danger => "text-danger",
                TypeColorText.Light => "text-light",
                TypeColorText.Dark => "text-dark",
                TypeColorText.White => "text-white",
                TypeColorText.Highlight => "text-highlight",
                _ => string.Empty,
            };
        }
    }
}
