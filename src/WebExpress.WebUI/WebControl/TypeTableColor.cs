namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the different types of color tables, table rows or cells.
    /// </summary>
    public enum TypeTableColor
    {
        /// <summary>
        /// The default color.
        /// </summary>
        Default,

        /// <summary>
        /// The primary color.
        /// </summary>
        Primary,

        /// <summary>
        /// The secondary color.
        /// </summary>
        Secondary,

        /// <summary>
        /// The success color.
        /// </summary>
        Success,

        /// <summary>
        /// The info color.
        /// </summary>
        Info,

        /// <summary>
        /// The warning color.
        /// </summary>
        Warning,

        /// <summary>
        /// The danger layout.
        /// </summary>
        Danger,

        /// <summary>
        /// The light color.
        /// </summary>
        Light,

        /// <summary>
        /// The dark color.
        /// </summary>
        Dark
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeTableColor"/> enum.
    /// </summary>
    public static class TypeTableColorExtensions
    {
        /// <summary>
        /// Converts the layout to a CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The CSS class corresponding to the layout.</returns>
        public static string ToClass(this TypeTableColor layout)
        {
            return layout switch
            {
                TypeTableColor.Primary => "table-primary",
                TypeTableColor.Secondary => "table-secondary",
                TypeTableColor.Success => "table-success",
                TypeTableColor.Info => "table-info",
                TypeTableColor.Warning => "table-warning",
                TypeTableColor.Danger => "table-danger",
                TypeTableColor.Light => "table-light",
                TypeTableColor.Dark => "table-dark",
                _ => string.Empty,
            };
        }
    }
}
