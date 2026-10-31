using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a paragraph of inline content, broken into lines at the width of its
    /// container and across pages line by line.
    /// </summary>
    public class PdfBlockElementParagraph : PdfBlockElement
    {
        private readonly List<PdfInlineElement> _content = [];

        /// <summary>
        /// Returns the inline content.
        /// </summary>
        public IEnumerable<PdfInlineElement> Content => _content;

        /// <summary>
        /// Gets or sets the alignment, or null to take the one of the container (a table
        /// cell, a centered region).
        /// </summary>
        public PdfTextAlign? Align { get; set; }

        /// <summary>
        /// Gets or sets the indentation from the left edge of the container, in points.
        /// </summary>
        public float Indent { get; set; }

        /// <summary>
        /// Gets or sets the color filling the area of the paragraph, or null for none.
        /// </summary>
        public PdfColor? Background { get; set; }

        /// <summary>
        /// Returns the text of the element without any formatting.
        /// </summary>
        public override string PlainText => string.Concat(_content.Select(x => x.PlainText));

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public PdfBlockElementParagraph()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="content">The inline content.</param>
        public PdfBlockElementParagraph(IEnumerable<PdfInlineElement> content)
        {
            _content.AddRange(content ?? []);
        }

        /// <summary>
        /// Initializes a new instance of the class with a single run of plain text.
        /// </summary>
        /// <param name="text">The text.</param>
        /// <param name="style">The style, or null for plain body text.</param>
        public PdfBlockElementParagraph(string text, PdfTextStyle style = null)
        {
            _content.Add(new PdfInlineElementText(text, style));
        }

        /// <summary>
        /// Adds one or more inline elements to the paragraph.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementParagraph Add(params PdfInlineElement[] content)
        {
            _content.AddRange(content);

            return this;
        }

        /// <summary>
        /// Adds one or more inline elements to the paragraph.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementParagraph Add(IEnumerable<PdfInlineElement> content)
        {
            _content.AddRange(content);

            return this;
        }
    }
}
