using System.Collections.Generic;

namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents an item of a list. It holds blocks rather than inline content, so an item
    /// can carry several paragraphs and the list nested below it.
    /// </summary>
    public class PdfBlockElementListItem : PdfBlockElementContainer
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="content">The blocks.</param>
        public PdfBlockElementListItem(IEnumerable<PdfBlockElement> content = null)
            : base(content)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class with a paragraph of plain text.
        /// </summary>
        /// <param name="text">The text.</param>
        public PdfBlockElementListItem(string text)
            : base([new PdfBlockElementParagraph(text)])
        {
        }

        /// <summary>
        /// Adds one or more blocks.
        /// </summary>
        /// <param name="content">The blocks to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementListItem Add(params PdfBlockElement[] content)
        {
            AddContent(content);

            return this;
        }

        /// <summary>
        /// Adds one or more blocks.
        /// </summary>
        /// <param name="content">The blocks to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementListItem Add(IEnumerable<PdfBlockElement> content)
        {
            AddContent(content);

            return this;
        }
    }
}
