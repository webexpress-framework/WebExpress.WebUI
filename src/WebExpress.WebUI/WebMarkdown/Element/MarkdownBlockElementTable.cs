using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a Markdown table element in the AST.
    /// </summary>
    public class MarkdownBlockElementTable : MarkdownBlockElement
    {
        private readonly List<MarkdownBlockElementTableCell> _columns = [];
        private readonly List<IEnumerable<MarkdownBlockElementTableCell>> _rows = [];
        private readonly List<MarkdownBlockElementTableCell> _footers = [];

        /// <summary>
        /// Returns the table header cells.
        /// </summary>
        public IEnumerable<MarkdownBlockElementTableCell> Columns => _columns;

        /// <summary>
        /// Returns the table rows. Each row is a list of cell contents.
        /// </summary>
        public IEnumerable<IEnumerable<MarkdownBlockElementTableCell>> Rows => _rows;

        /// <summary>
        /// Returns the table footer cells.
        /// </summary>
        public IEnumerable<MarkdownBlockElementTableCell> Footers => _footers;

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText
        {
            get
            {
                var column = _columns.Select(x => x.PlainText.Trim());
                var rows = string.Join(" ", _rows.SelectMany(x => x).Select(x => x.PlainText.Trim()));
                var footer = string.Join(" ", _footers.Select(x => x.PlainText.Trim()));

                return $"{column} {rows} {footer}".Trim();
            }
        }

        /// <summary>
        /// Initializes a new instance of the Table class.
        /// </summary>
        public MarkdownBlockElementTable() { }

        /// <summary>
        /// Adds columns to the table.
        /// </summary>
        /// <param name="columns">A collection of Markdown elements representing the columns.</param>
        /// <returns>The current instance for method chaining.</returns>
        public MarkdownBlockElementTable AddColumn(MarkdownBlockElementTableCell columns)
        {
            _columns.Add(columns);

            return this;
        }

        /// <summary>
        /// Adds rows to the table.
        /// </summary>
        /// <param name="rows">
        /// A collection of rows, where each row is a collection of Markdown elements 
        /// representing the cells.
        /// </param>
        /// <returns>The current instance for method chaining.</returns>
        public MarkdownBlockElementTable AddRow(IEnumerable<MarkdownBlockElementTableCell> rows)
        {
            _rows.Add(rows);

            return this;
        }

        /// <summary>
        /// Adds footer elements to the table.
        /// </summary>
        /// <param name="footerElements">A collection of Markdown elements representing the footer.</param>
        /// <returns>The current instance for method chaining.</returns>
        public MarkdownBlockElementTable AddFooter(MarkdownBlockElementTableCell footerElements)
        {
            _footers.Add(footerElements);

            return this;
        }
    }
}