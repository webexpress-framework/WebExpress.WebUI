using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a indent segment in a Markdown document.
    /// </summary>
    public class MarkdownBlockElementIndent : MarkdownBlockElement
    {
        private readonly List<IMarkdownElement> _content = [];

        /// <summary>
        /// Returns the indent elements.
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
        public MarkdownBlockElementIndent()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        public MarkdownBlockElementIndent(IEnumerable<IMarkdownElement> content)
        {
            _content.AddRange(content);
        }

        /// <summary>
        /// Adds one or more elements to the indent.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownBlockElementIndent Add(params IMarkdownElement[] content)
        {
            _content.AddRange(content);

            return this;
        }

        /// <summary>
        /// Adds one or more elements to the indent.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownBlockElementIndent Add(IEnumerable<IMarkdownElement> content)
        {
            _content.AddRange(content);

            return this;
        }
    }
}