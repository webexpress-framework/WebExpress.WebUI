using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a header element (e.g. # Header).
    /// </summary>
    public class MarkdownBlockElementHeader : MarkdownBlockElement
    {
        private readonly List<IMarkdownElement> _content = [];

        /// <summary>
        /// Returns the header level (1-6).
        /// </summary>
        public int Level { get; }

        /// <summary>
        /// Returns the content of the header.
        /// </summary>
        public IEnumerable<IMarkdownElement> Content => _content;

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => string.Join(" ", _content.Select(e => e.PlainText.Trim())
            .Where(s => !string.IsNullOrWhiteSpace(s)));

        /// <summary>
        /// Initializes a new instance of the <see cref="MarkdownBlockElementHeader"/> class with the specified header level and content.
        /// </summary>
        /// <param name="level">The header level (must be between 1 and 6).</param>
        /// <param name="content">The inline content of the header.</param>
        public MarkdownBlockElementHeader(int level, IEnumerable<MarkdownInlineElement> content)
        {
            // Validate level to ensure only valid Markdown header levels are accepted
            if (level < 1) level = 1;
            if (level > 6) level = 6;

            _content.AddRange(content);
            Level = level;
        }
    }
}