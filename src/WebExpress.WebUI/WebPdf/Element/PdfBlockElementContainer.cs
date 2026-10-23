using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a block that holds further blocks. It is the common base of the elements
    /// that frame their content - a quote, a callout, a list item, a table cell - so a
    /// renderer can fill any of them the same way.
    /// </summary>
    public abstract class PdfBlockElementContainer : PdfBlockElement
    {
        private readonly List<PdfBlockElement> _content = [];

        /// <summary>
        /// Returns the blocks.
        /// </summary>
        public IEnumerable<PdfBlockElement> Content => _content;

        /// <summary>
        /// Returns the text of the element without any formatting.
        /// </summary>
        public override string PlainText => string.Join("\n", _content.Select(x => x.PlainText));

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="content">The blocks.</param>
        protected PdfBlockElementContainer(IEnumerable<PdfBlockElement> content = null)
        {
            _content.AddRange(content ?? []);
        }

        /// <summary>
        /// Adds one or more blocks.
        /// </summary>
        /// <param name="content">The blocks to add.</param>
        protected void AddContent(IEnumerable<PdfBlockElement> content)
        {
            _content.AddRange(content.Where(x => x is not null));
        }
    }
}
