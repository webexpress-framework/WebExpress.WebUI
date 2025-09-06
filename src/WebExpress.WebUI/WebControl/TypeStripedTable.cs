namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the table styling options for a striped type table.
    /// </summary>
    public enum TypeStripedTable
    {
        /// <summary>
        /// Represents the default behavior.
        /// </summary>
        Default,

        /// <summary>
        /// Represents that the columns are striped.
        /// </summary>
        Column,

        /// <summary>
        /// Represents that the rows are striped.
        /// </summary>
        Row,

        /// <summary>
        /// Represents that both columns and rows are striped.
        /// </summary>
        Both
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeStripedTable"/> enum.
    /// </summary>
    public static class TypeStripedTableExtensions
    {
        /// <summary>
        /// Converts the layout to a CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The CSS class corresponding to the layout.</returns>
        public static string ToClass(this TypeStripedTable layout)
        {
            return layout switch
            {
                TypeStripedTable.Column => "table-striped-columns",
                TypeStripedTable.Row => "table-striped",
                TypeStripedTable.Both => "table-striped-columns table-striped",
                _ => string.Empty,
            };
        }
    }
}
