namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration for different background color types for a list.
    /// </summary>
    public enum TypeColorBackgroundList
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
        Transparent = 10
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeColorBackgroundList"/> enumeration.
    /// </summary>
    public static class TypeColorBackgroundListExtensions
    {
        /// <summary>
        /// Conversion to a CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted</param>
        /// <returns>The CSS class belonging to the layout</returns>
        public static string ToClass(this TypeColorBackgroundList layout)
        {
            return layout switch
            {
                TypeColorBackgroundList.Primary => "wx-list-bg-primary",
                TypeColorBackgroundList.Secondary => "wx-list-bg-secondary",
                TypeColorBackgroundList.Success => "wx-list-bg-success",
                TypeColorBackgroundList.Info => "wx-list-bg-info",
                TypeColorBackgroundList.Warning => "wx-list-bg-warning",
                TypeColorBackgroundList.Danger => "wx-list-bg-danger",
                TypeColorBackgroundList.Light => "wx-list-bg-light",
                TypeColorBackgroundList.Dark => "wx-list-bg-dark",
                TypeColorBackgroundList.White => "wx-list-bg-white",
                TypeColorBackgroundList.Transparent => "wx-list-bg-transparent",
                _ => string.Empty,
            };
        }
    }
}
