namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the border style for a table.
    /// </summary>
    public enum TypeBorderTable
    {
        /// <summary>
        /// Represents the default behavior.
        /// </summary>
        Default,

        /// <summary>
        /// Represents a borderless table style.
        /// </summary>
        Borderless,

        /// <summary>
        /// Represents a bordered table style.
        /// </summary>
        Bordered
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeBorderTable"/> enum.
    /// </summary>
    public static class TypeBorderTableExtensions
    {
        /// <summary>
        /// Converts the layout to a CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The CSS class corresponding to the layout.</returns>
        public static string ToClass(this TypeBorderTable layout)
        {
            return layout switch
            {
                TypeBorderTable.Borderless => "table-borderless",
                TypeBorderTable.Bordered => "table-bordered",
                _ => string.Empty,
            };
        }
    }
}
