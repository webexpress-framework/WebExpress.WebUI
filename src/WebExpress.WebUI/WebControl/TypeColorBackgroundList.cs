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
                TypeColorBackgroundList.Primary => "list-group-item-primary",
                TypeColorBackgroundList.Secondary => "list-group-item-secondary",
                TypeColorBackgroundList.Success => "list-group-item-success",
                TypeColorBackgroundList.Info => "list-group-item-info",
                TypeColorBackgroundList.Warning => "list-group-item-warning",
                TypeColorBackgroundList.Danger => "list-group-item-danger",
                TypeColorBackgroundList.Light => "list-group-item-light",
                TypeColorBackgroundList.Dark => "list-group-item-dark",
                TypeColorBackgroundList.White => "bg-white",
                TypeColorBackgroundList.Transparent => "bg-transparent",
                _ => string.Empty,
            };
        }
    }
}
