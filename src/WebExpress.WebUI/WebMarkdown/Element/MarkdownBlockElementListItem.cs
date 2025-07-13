using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a single list item.
    /// </summary>
    public class MarkdownBlockElementListItem : MarkdownBlockElement
    {
        private readonly int _indent = 0;
        private readonly int _orderedNumber = int.MinValue;
        private readonly MarkdownListType _orderedType = MarkdownListType.Numeric;
        private readonly List<IMarkdownElement> _content = [];

        /// <summary>
        /// Returns the current indentation level.
        /// </summary>
        public int Indent => _indent;

        /// <summary>
        /// Returns the ordered number.
        /// </summary>
        public int OrderedNumber => _orderedNumber;

        /// <summary>
        /// Returns the type of the ordered list.
        /// </summary>
        public MarkdownListType OrderedType => _orderedType;

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
        /// Initializes a new instance of the class.
        /// </summary>
        public MarkdownBlockElementListItem()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="indent">The indentation level.</param>
        /// <param name="content">The elements to add.</param>
        public MarkdownBlockElementListItem(int indent, IEnumerable<IMarkdownElement> content)
        {
            _indent = indent;
            _content.AddRange(content);
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="indent">The indentation level.</param>
        /// <param name="orderedNumber">The ordered number.</param>
        /// <param name="orderedType"> The type of the ordered list.</param>
        /// <param name="content">The elements to add.</param>
        public MarkdownBlockElementListItem(int indent, int orderedNumber, MarkdownListType orderedType, IEnumerable<IMarkdownElement> content)
        {
            _indent = indent;
            _orderedNumber = orderedNumber;
            _orderedType = orderedType;
            _content.AddRange(content);
        }

        /// <summary>
        /// Adds one or more elements to the list item.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownBlockElementListItem Add(params IMarkdownElement[] content)
        {
            _content.AddRange(content);

            return this;
        }

        /// <summary>
        /// Adds one or more elements to the list item.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownBlockElementListItem Add(IEnumerable<IMarkdownElement> content)
        {
            _content.AddRange(content);

            return this;
        }
    }
}