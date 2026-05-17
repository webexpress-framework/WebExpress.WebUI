namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The progress background colors.
    /// </summary>
    public enum TypeColorProgress
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
        /// Highlight background color.
        /// </summary>
        Highlight = 13
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeColorProgress"/> enum.
    /// </summary>
    public static class TypeColorProgressExtensions
    {
        /// <summary>
        /// Converts the background color to a CSS class.
        /// </summary>
        /// <param name="color">The background color to be converted.</param>
        /// <returns>The CSS class corresponding to the background color.</returns>
        public static string ToClass(this TypeColorProgress color)
        {
            return color switch
            {
                TypeColorProgress.Primary => "bg-primary",
                TypeColorProgress.Secondary => "bg-secondary",
                TypeColorProgress.Success => "bg-success",
                TypeColorProgress.Info => "bg-info",
                TypeColorProgress.Warning => "bg-warning",
                TypeColorProgress.Danger => "bg-danger",
                TypeColorProgress.Light => "bg-light",
                TypeColorProgress.Dark => "bg-dark",
                TypeColorProgress.White => "bg-white",
                TypeColorProgress.Highlight => "bg-highlight",
                _ => string.Empty,
            };
        }
    }
}
