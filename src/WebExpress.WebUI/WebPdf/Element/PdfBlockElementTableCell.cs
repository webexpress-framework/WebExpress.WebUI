using System;
using System.Collections.Generic;

namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a cell of a table. It holds blocks, so a cell can carry a list or a
    /// paragraph break the same way a cell of the editor can.
    /// </summary>
    public class PdfBlockElementTableCell : PdfBlockElementContainer
    {
        private int _colSpan = 1;

        /// <summary>
        /// Gets or sets the alignment of the paragraphs in the cell that do not set their own.
        /// </summary>
        public PdfTextAlign? Align { get; set; }

        /// <summary>
        /// Gets or sets the number of columns the cell spans.
        /// </summary>
        public int ColSpan
        {
            get => _colSpan;
            set => _colSpan = Math.Max(1, value);
        }

        /// <summary>
        /// Gets or sets the color filling the cell, or null for the color of the row.
        /// </summary>
        public PdfColor? Background { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="content">The blocks.</param>
        public PdfBlockElementTableCell(IEnumerable<PdfBlockElement> content = null)
            : base(content)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class with a paragraph of plain text.
        /// </summary>
        /// <param name="text">The text.</param>
        public PdfBlockElementTableCell(string text)
            : base([new PdfBlockElementParagraph(text)])
        {
        }

        /// <summary>
        /// Adds one or more blocks.
        /// </summary>
        /// <param name="content">The blocks to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementTableCell Add(params PdfBlockElement[] content)
        {
            AddContent(content);

            return this;
        }

        /// <summary>
        /// Adds one or more blocks.
        /// </summary>
        /// <param name="content">The blocks to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementTableCell Add(IEnumerable<PdfBlockElement> content)
        {
            AddContent(content);

            return this;
        }
    }
}
