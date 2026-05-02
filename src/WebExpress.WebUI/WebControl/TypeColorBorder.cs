namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration for different types of border colors.
    /// </summary>
    public enum TypeColorBorder
    {
        /// <summary>
        /// Default border color.
        /// </summary>
        Default = 0,

        /// <summary>
        /// Primary border color.
        /// </summary>
        Primary = 1,

        /// <summary>
        /// Secondary border color.
        /// </summary>
        Secondary = 2,

        /// <summary>
        /// Success border color.
        /// </summary>
        Success = 3,

        /// <summary>
        /// Info border color.
        /// </summary>
        Info = 4,

        /// <summary>
        /// Warning border color.
        /// </summary>
        Warning = 5,

        /// <summary>
        /// Danger border color.
        /// </summary>
        Danger = 6,

        /// <summary>
        /// Dark border color.
        /// </summary>
        Dark = 7,

        /// <summary>
        /// Light border color.
        /// </summary>
        Light = 8,

        /// <summary>
        /// White border color.
        /// </summary>
        White = 9,

        /// <summary>
        /// Transparent border color.
        /// </summary>
        Transparent = 10,

        /// <summary>
        /// Highlight border color.
        /// </summary>
        Highlight = 13
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeColorBorder"/> enumeration.
    /// </summary>
    public static class TypeColorBorderExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeColorBorder"/> to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The border color type to be converted.</param>
        /// <returns>The CSS class corresponding to the border color type.</returns>
        public static string ToClass(this TypeColorBorder layout)
        {
            return layout switch
            {
                TypeColorBorder.Primary => "border-primary",
                TypeColorBorder.Secondary => "border-secondary",
                TypeColorBorder.Success => "border-success",
                TypeColorBorder.Info => "border-info",
                TypeColorBorder.Warning => "border-warning",
                TypeColorBorder.Danger => "border-danger",
                TypeColorBorder.Light => "border-light",
                TypeColorBorder.Dark => "border-dark",
                TypeColorBorder.White => "border-white",
                TypeColorBorder.Transparent => "border-transparent",
                TypeColorBorder.Highlight => "border-highlight",
                _ => string.Empty,
            };
        }
    }
}
