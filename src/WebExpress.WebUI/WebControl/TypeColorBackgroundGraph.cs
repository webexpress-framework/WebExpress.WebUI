namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the different types of background colors for the graph control.
    /// </summary>
    public enum TypeColorBackgroundGraph
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
    /// Provides extension methods for the <see cref="TypeColorBackgroundGraph"/> enumeration.
    /// </summary>
    public static class TypeColorBackgroundGraphExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeColorBackgroundAlert"/> value to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The <see cref="TypeColorBackgroundGraph"/> value to be converted.</param>
        /// <returns>The CSS class corresponding to the <see cref="TypeColorBackgroundAlert"/> value.</returns>
        public static string ToClass(this TypeColorBackgroundGraph layout)
        {
            return layout switch
            {
                TypeColorBackgroundGraph.Primary => "bg-primary",
                TypeColorBackgroundGraph.Secondary => "bg-secondary",
                TypeColorBackgroundGraph.Success => "bg-success",
                TypeColorBackgroundGraph.Info => "bg-info",
                TypeColorBackgroundGraph.Warning => "bg-warning",
                TypeColorBackgroundGraph.Danger => "bg-danger",
                TypeColorBackgroundGraph.Light => "bg-light",
                TypeColorBackgroundGraph.Dark => "bg-dark",
                TypeColorBackgroundGraph.White => "bg-white",
                TypeColorBackgroundGraph.Transparent => "bg-transparent",
                TypeColorBackgroundGraph.Highlight => "bg-highlight",
                _ => string.Empty,
            };
        }
    }
}
