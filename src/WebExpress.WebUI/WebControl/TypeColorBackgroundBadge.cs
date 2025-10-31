namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration for different types of background colors for badges.
    /// </summary>
    public enum TypeColorBackgroundBadge
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
        Light = 8
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeColorBackgroundBadge"/> enumeration.
    /// </summary>
    public static class TypeColorBackgroundBadgeExtensions
    {
        /// <summary>
        /// Conversion to a CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted</param>
        /// <returns>The CSS class belonging to the layout</returns>
        public static string ToClass(this TypeColorBackgroundBadge layout)
        {
            return layout switch
            {
                TypeColorBackgroundBadge.Primary => "text-bg-primary",
                TypeColorBackgroundBadge.Secondary => "text-bg-secondary",
                TypeColorBackgroundBadge.Success => "text-bg-success",
                TypeColorBackgroundBadge.Info => "text-bg-info",
                TypeColorBackgroundBadge.Warning => "text-bg-warning",
                TypeColorBackgroundBadge.Danger => "text-bg-danger",
                TypeColorBackgroundBadge.Light => "text-bg-light",
                TypeColorBackgroundBadge.Dark => "text-bg-dark",
                _ => string.Empty,
            };
        }
    }
}
