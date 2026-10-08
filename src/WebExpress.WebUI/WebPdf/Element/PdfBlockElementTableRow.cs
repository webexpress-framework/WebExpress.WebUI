using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a row of a table.
    /// </summary>
    public class PdfBlockElementTableRow : IPdfElement
    {
        private readonly List<PdfBlockElementTableCell> _cells = [];

        /// <summary>
        /// Returns the cells.
        /// </summary>
        public IEnumerable<PdfBlockElementTableCell> Cells => _cells;

        /// <summary>
        /// Gets or sets a value indicating whether the row is a header row. Header rows are
        /// set in bold on a shaded background, and the header rows at the top of a table are
        /// repeated on every page the table continues on.
        /// </summary>
        public bool Header { get; set; }

        /// <summary>
        /// Gets or sets the color filling the row, or null for the color the table gives it.
        /// </summary>
        public PdfColor? Background { get; set; }

        /// <summary>
        /// Returns the text of the element without any formatting.
        /// </summary>
        public string PlainText => string.Join(" ", _cells.Select(x => x.PlainText));

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="cells">The cells.</param>
        public PdfBlockElementTableRow(IEnumerable<PdfBlockElementTableCell> cells = null)
        {
            _cells.AddRange(cells ?? []);
        }

        /// <summary>
        /// Adds one or more cells.
        /// </summary>
        /// <param name="cells">The cells to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementTableRow Add(params PdfBlockElementTableCell[] cells)
        {
            _cells.AddRange(cells.Where(x => x is not null));

            return this;
        }

        /// <summary>
        /// Adds one or more cells.
        /// </summary>
        /// <param name="cells">The cells to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementTableRow Add(IEnumerable<PdfBlockElementTableCell> cells)
        {
            _cells.AddRange(cells.Where(x => x is not null));

            return this;
        }
    }
}
