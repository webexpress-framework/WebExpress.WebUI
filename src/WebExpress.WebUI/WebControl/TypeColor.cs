namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The standard background colors.
    /// </summary>
    public enum TypeColor
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
        /// Transparent color.
        /// </summary>
        Transparent = 10,

        /// <summary>
        /// Mute color.
        /// </summary>
        Mute = 11,

        /// <summary>
        /// User-defined color.
        /// </summary>
        User = 12,

        /// <summary>
        /// Highlight color.
        /// </summary>
        Highlight = 13
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeColor"/> enum.
    /// </summary>
    public static class TypeColorExtensions
    {
        /// <summary>
        /// Converts the background color to a CSS class.
        /// </summary>
        /// <param name="color">The background color to be converted.</param>
        /// <returns>The CSS class corresponding to the background color.</returns>
        public static string ToClass(this TypeColor color)
        {
            return color switch
            {
                TypeColor.Primary => "primary",
                TypeColor.Secondary => "secondary",
                TypeColor.Success => "success",
                TypeColor.Info => "info",
                TypeColor.Warning => "warning",
                TypeColor.Danger => "danger",
                TypeColor.Light => "light",
                TypeColor.Dark => "dark",
                TypeColor.White => "white",
                TypeColor.Transparent => "transparent",
                TypeColor.Mute => "mute",
                TypeColor.Highlight => "highlight",
                _ => string.Empty,
            };
        }
    }
}
