namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The standard colors.
    /// </summary>
    public enum TypeColorGraph
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
        Light = 8
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeColorGraph"/> enum.
    /// </summary>
    public static class TypeColorGraphExtensions
    {
        /// <summary>
        /// Converts the background color to a CSS class.
        /// </summary>
        /// <param name="color">The background color to be converted.</param>
        /// <returns>The CSS class corresponding to the background color.</returns>
        public static string ToClass(this TypeColorGraph color)
        {
            return color switch
            {
                TypeColorGraph.Primary => "primary",
                TypeColorGraph.Secondary => "secondary",
                TypeColorGraph.Success => "success",
                TypeColorGraph.Info => "info",
                TypeColorGraph.Warning => "warning",
                TypeColorGraph.Danger => "danger",
                TypeColorGraph.Light => "light",
                TypeColorGraph.Dark => "dark",
                _ => string.Empty,
            };
        }
    }
}
