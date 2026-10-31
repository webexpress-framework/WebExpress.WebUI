using System.Collections.Generic;

namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a quotation, indented and marked by a bar along its left edge. The bar
    /// follows the quote onto every page it continues on.
    /// </summary>
    public class PdfBlockElementQuote : PdfBlockElementContainer
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="content">The blocks.</param>
        public PdfBlockElementQuote(IEnumerable<PdfBlockElement> content = null)
            : base(content)
        {
        }

        /// <summary>
        /// Adds one or more blocks.
        /// </summary>
        /// <param name="content">The blocks to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementQuote Add(params PdfBlockElement[] content)
        {
            AddContent(content);

            return this;
        }
    }
}
