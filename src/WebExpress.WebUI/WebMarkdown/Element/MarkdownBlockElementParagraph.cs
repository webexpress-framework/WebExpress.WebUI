using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a paragraph element.
    /// </summary>
    public class MarkdownBlockElementParagraph : MarkdownBlockElement
    {
        private readonly List<MarkdownInlineElement> _content = [];

        /// <summary>
        /// List of inline elements contained in the paragraph.
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
        public MarkdownBlockElementParagraph()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        public MarkdownBlockElementParagraph(IEnumerable<MarkdownInlineElement> content)
        {
            _content.AddRange(content);
        }

        /// <summary>
        /// Adds one or more inline elements to the paragraph.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownBlockElementParagraph Add(params MarkdownInlineElement[] content)
        {
            _content.AddRange(content);

            return this;
        }

        /// <summary>
        /// Adds one or more inline elements to the paragraph.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownBlockElementParagraph Add(IEnumerable<MarkdownInlineElement> content)
        {
            _content.AddRange(content);

            return this;
        }
    }
}