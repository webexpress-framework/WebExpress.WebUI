using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a table.
    /// <para>
    /// The column widths follow the content the way a browser sizes a table with automatic
    /// layout: every column gets at least its longest word and the remaining width is shared
    /// by how much text a column would like to put on one line. <see cref="ColumnWidths"/>
    /// overrides this with fixed proportions, which is how the editor stores a table whose
    /// columns the author has resized.
    /// </para>
    /// <para>
    /// A row is kept on one page when it fits on one; a row taller than a page is split, with
    /// every cell continuing on the next page. Without <see cref="Bordered"/> the table draws
    /// nothing of its own, which turns it into a column layout - the form the regions of an
    /// editor row are rendered in.
    /// </para>
    /// </summary>
    public class PdfBlockElementTable : PdfBlockElement
    {
        private readonly List<PdfBlockElementTableRow> _rows = [];
        private readonly List<float> _columnWidths = [];

        /// <summary>
        /// Returns the rows.
        /// </summary>
        public IEnumerable<PdfBlockElementTableRow> Rows => _rows;

        /// <summary>
        /// Returns the widths of the columns, or an empty sequence for widths that follow the
        /// content. When every column has a width, only the proportions count and the table
        /// spans the width of its container. A width of zero leaves a column open, as a
        /// <c>&lt;col&gt;</c> without a width does: the given widths are then lengths in points,
        /// and the open columns share what is left.
        /// </summary>
        public IEnumerable<float> ColumnWidths => _columnWidths;

        /// <summary>
        /// Gets or sets a value indicating whether the cells are framed by lines.
        /// </summary>
        public bool Bordered { get; set; } = true;

        /// <summary>
        /// Gets or sets a value indicating whether every other body row is shaded.
        /// </summary>
        public bool Striped { get; set; }

        /// <summary>
        /// Returns the text of the element without any formatting.
        /// </summary>
        public override string PlainText => string.Join("\n", _rows.Select(x => x.PlainText));

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public PdfBlockElementTable()
        {
        }

        /// <summary>
        /// Adds one or more rows.
        /// </summary>
        /// <param name="rows">The rows to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementTable Add(params PdfBlockElementTableRow[] rows)
        {
            _rows.AddRange(rows.Where(x => x is not null));

            return this;
        }

        /// <summary>
        /// Adds one or more rows.
        /// </summary>
        /// <param name="rows">The rows to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementTable Add(IEnumerable<PdfBlockElementTableRow> rows)
        {
            _rows.AddRange(rows.Where(x => x is not null));

            return this;
        }

        /// <summary>
        /// Sets fixed widths for the columns.
        /// </summary>
        /// <param name="widths">The widths, one per column; zero leaves a column open.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementTable SetColumnWidths(IEnumerable<float> widths)
        {
            _columnWidths.Clear();
            _columnWidths.AddRange(widths ?? []);

            return this;
        }
    }
}
