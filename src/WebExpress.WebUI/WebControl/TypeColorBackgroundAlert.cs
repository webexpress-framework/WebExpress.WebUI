namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the different types of background colors for alerts.
    /// </summary>
    public enum TypeColorBackgroundAlert
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
    /// Provides extension methods for the <see cref="TypeColorBackgroundAlert"/> enumeration.
    /// </summary>
    public static class TypeColorBackgroundAlertExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeColorBackgroundAlert"/> value to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The <see cref="TypeColorBackgroundAlert"/> value to be converted.</param>
        /// <returns>The CSS class corresponding to the <see cref="TypeColorBackgroundAlert"/> value.</returns>
        public static string ToClass(this TypeColorBackgroundAlert layout)
        {
            return layout switch
            {
                TypeColorBackgroundAlert.Primary => "bg-primary",
                TypeColorBackgroundAlert.Secondary => "bg-secondary",
                TypeColorBackgroundAlert.Success => "alert-success",
                TypeColorBackgroundAlert.Info => "alert-info",
                TypeColorBackgroundAlert.Warning => "alert-warning",
                TypeColorBackgroundAlert.Danger => "alert-danger",
                TypeColorBackgroundAlert.Light => "alert-light",
                TypeColorBackgroundAlert.Dark => "alert-dark",
                TypeColorBackgroundAlert.White => "bg-white",
                TypeColorBackgroundAlert.Transparent => "bg-transparent",
                TypeColorBackgroundAlert.Highlight => "alert-highlight",
                _ => string.Empty,
            };
        }
    }
}
