namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration representing different types of navbar colors.
    /// </summary>
    public enum TypeColorNavbar
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
        /// Highlight color.
        /// </summary>
        Highlight = 13
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeColorNavbar"/> enumeration.
    /// </summary>
    public static class TypeColorNavbarExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeColorNavbar"/> value to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The <see cref="TypeColorNavbar"/> value to be converted.</param>
        /// <returns>The CSS class corresponding to the <see cref="TypeColorNavbar"/> value.</returns>
        public static string ToClass(this TypeColorNavbar layout)
        {
            return layout switch
            {
                TypeColorNavbar.Primary => "navbar-primary",
                TypeColorNavbar.Secondary => "navbar-secondary",
                TypeColorNavbar.Success => "navbar-success",
                TypeColorNavbar.Info => "navbar-info",
                TypeColorNavbar.Warning => "navbar-warning",
                TypeColorNavbar.Danger => "navbar-danger",
                TypeColorNavbar.Light => "navbar-light",
                TypeColorNavbar.Dark => "navbar-dark",
                TypeColorNavbar.White => "navbar-white",
                TypeColorNavbar.Transparent => "navbar-transparent",
                TypeColorNavbar.Highlight => "navbar-highlight",
                _ => string.Empty,
            };
        }
    }
}
