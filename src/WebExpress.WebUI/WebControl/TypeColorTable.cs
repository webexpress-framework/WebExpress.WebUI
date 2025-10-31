namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the different types of color tables, table rows or cells.
    /// </summary>
    public enum TypeColorTable
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
    /// Extension methods for the <see cref="TypeColorTable"/> enum.
    /// </summary>
    public static class TypeColorTableExtensions
    {
        /// <summary>
        /// Converts the layout to a CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The CSS class corresponding to the layout.</returns>
        public static string ToClass(this TypeColorTable layout)
        {
            return layout switch
            {
                TypeColorTable.Primary => "table-primary",
                TypeColorTable.Secondary => "table-secondary",
                TypeColorTable.Success => "table-success",
                TypeColorTable.Info => "table-info",
                TypeColorTable.Warning => "table-warning",
                TypeColorTable.Danger => "table-danger",
                TypeColorTable.Light => "table-light",
                TypeColorTable.Dark => "table-dark",
                _ => string.Empty,
            };
        }
    }
}
