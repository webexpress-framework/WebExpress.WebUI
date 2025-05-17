using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a table control that is part of the web UI.
    /// </summary>
    public interface IControlTable : IControl
    {
        /// <summary>
        /// Returns the columns of the table.
        /// </summary>
        IEnumerable<IControlTableColumn> Columns { get; }

        /// <summary>
        /// Returns the rows of the table.
        /// </summary>
        IEnumerable<IControlTableRow> Rows { get; }

        /// <summary>
        /// Returns a value indicating whether the table is striped.
        /// </summary>
        TypeTableStriped Striped { get; }

        /// <summary>
        /// Returns or sets the color scheme used for the table.
        /// </summary>
        TypeTableColor Color { get; }

        /// <summary>
        /// Returns the header color scheme used for the table.
        /// </summary>
        TypeTableColor HeaderColor { get; }

        /// <summary>
        /// Returns a value indicating whether the table has a visible border.
        /// </summary>
        TypeTableBorder TableBorder { get; }

        /// <summary>
        /// Adds a column to the table.
        /// </summary>
        /// <param name="name">The header of the column.</param>
        /// <param name="icon">The icon of the column.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTable AddColumn(string name, IIcon icon = null);

        /// <summary>
        /// Adds one or more columns to the table.
        /// </summary>
        /// <param name="columns">The columns to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTable AddColumns(params IControlTableColumn[] columns);

        /// <summary>
        /// Adds one or more columns to the table.
        /// </summary>
        /// <param name="columns">The columns to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTable AddColumns(IEnumerable<IControlTableColumn> columns);

        /// <summary>
        /// Adds a row to the table.
        /// </summary>
        /// <param name="cells">The cells of the row.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTable AddRow(params IControlTableCell[] cells);

        /// <summary>
        /// Adds one or more rows to the table.
        /// </summary>
        /// <param name="rows">The rows to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTable AddRows(params IControlTableRow[] rows);

        /// <summary>
        /// Adds one or more rows to the table.
        /// </summary>
        /// <param name="rows">The rows to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTable AddRows(IEnumerable<IControlTableRow> rows);
    }
}
