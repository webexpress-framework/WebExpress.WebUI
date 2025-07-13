using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a blockquote element.
    /// </summary>
    public class MarkdownBlockElementQuote : MarkdownBlockElement
    {
        private readonly List<IMarkdownElement> _content = [];

        /// <summary>
        /// Returns the quoted elements.
        /// </summary>
        public IEnumerable<IMarkdownElement> Content => _content;

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => string.Join(" ", _content.Select(e => e.PlainText.Trim())
            .Where(s => !string.IsNullOrWhiteSpace(s)));

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public MarkdownBlockElementQuote()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        public MarkdownBlockElementQuote(IEnumerable<IMarkdownElement> content)
        {
            _content.AddRange(content);
        }

        // <summary>
        /// Adds one or more elements to the quote.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownBlockElementQuote Add(params IMarkdownElement[] content)
        {
            _content.AddRange(content);

            return this;
        }

        // <summary>
        /// Adds one or more elements to the quote.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownBlockElementQuote Add(IEnumerable<IMarkdownElement> content)
        {
            _content.AddRange(content);

            return this;
        }
    }
}