namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The standard background colors.
    /// </summary>
    public enum TypeColorBackground
    {
        /// <summary>
        /// Default background color.
        /// </summary>
        Default = 0,

        /// <summary>
        /// Primary background color.
        /// </summary>
        Primary = 1,

        /// <summary>
        /// Secondary background color.
        /// </summary>
        Secondary = 2,

        /// <summary>
        /// Success background color.
        /// </summary>
        Success = 3,

        /// <summary>
        /// Info background color.
        /// </summary>
        Info = 4,

        /// <summary>
        /// Warning background color.
        /// </summary>
        Warning = 5,

        /// <summary>
        /// Danger background color.
        /// </summary>
        Danger = 6,

        /// <summary>
        /// Dark background color.
        /// </summary>
        Dark = 7,

        /// <summary>
        /// Light background color.
        /// </summary>
        Light = 8,

        /// <summary>
        /// White background color.
        /// </summary>
        White = 9,

        /// <summary>
        /// Transparent background color.
        /// </summary>
        Transparent = 10,

        /// <summary>
        /// Highlight background color.
        /// </summary>
        Highlight = 13
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeColorBackground"/> enum.
    /// </summary>
    public static class TypeColorBackgroundExtensions
    {
        /// <summary>
        /// Converts the background color to a CSS class.
        /// </summary>
        /// <param name="color">The background color to convert.</param>
        /// <returns>The CSS class corresponding to the background color.</returns>
        public static string ToClass(this TypeColorBackground color)
        {
            return color switch
            {
                TypeColorBackground.Primary => "bg-primary",
                TypeColorBackground.Secondary => "bg-secondary",
                TypeColorBackground.Success => "bg-success",
                TypeColorBackground.Info => "bg-info",
                TypeColorBackground.Warning => "bg-warning",
                TypeColorBackground.Danger => "bg-danger",
                TypeColorBackground.Light => "bg-light",
                TypeColorBackground.Dark => "bg-dark",
                TypeColorBackground.White => "bg-white",
                TypeColorBackground.Transparent => "bg-transparent",
                TypeColorBackground.Highlight => "bg-highlight",
                _ => string.Empty,
            };
        }
    }
}
