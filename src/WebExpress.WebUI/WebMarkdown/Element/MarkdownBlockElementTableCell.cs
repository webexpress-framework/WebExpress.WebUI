using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a single cell within a Markdown table block element in the AST.
    /// </summary>
    public class MarkdownBlockElementTableCell : MarkdownBlockElement
    {
        private readonly MarkdownCellAlign _align;
        private readonly List<IMarkdownElement> _content = [];

        /// <summary>
        /// Returns the horizontal alignment for this cell's content.
        /// </summary>
        public MarkdownCellAlign Align => _align;

        /// <summary>
        /// Returns the content elements.
        /// </summary>
        public IEnumerable<IMarkdownElement> Content => _content;

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => string.Join(" ", _content.Select(e => e.PlainText.Trim())
            .Where(s => !string.IsNullOrWhiteSpace(s)));

        /// <summary>
        /// Initializes a new instance of the Table class.
        /// </summary>
        public MarkdownBlockElementTableCell()
        {
            _align = MarkdownCellAlign.Left;
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        public MarkdownBlockElementTableCell(IEnumerable<IMarkdownElement> content)
        {
            _align = MarkdownCellAlign.Left;
            _content.AddRange(content);
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="align">The horizontal alignment of the cell content.</param>
        /// <param name="content">The elements to add.</param>
        public MarkdownBlockElementTableCell(MarkdownCellAlign align, IEnumerable<IMarkdownElement> content)
        {
            _align = align;
            _content.AddRange(content);
        }

        /// <summary>
        /// Adds one or more elements to the cell.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownBlockElementTableCell Add(params IMarkdownElement[] content)
        {
            _content.AddRange(content);

            return this;
        }

        /// <summary>
        /// Adds one or more elements to the cell.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownBlockElementTableCell Add(IEnumerable<IMarkdownElement> content)
        {
            _content.AddRange(content);

            return this;
        }
    }
}