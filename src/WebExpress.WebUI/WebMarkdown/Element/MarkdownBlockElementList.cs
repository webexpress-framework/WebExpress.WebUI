using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a list element in a Markdown document.
    /// </summary>
    public class MarkdownBlockElementList : MarkdownBlockElement
    {
        private readonly List<MarkdownBlockElementListItem> _items = [];
        private MarkdownBlockElementList _child = null;

        /// <summary>
        /// Indicates whether the list is ordered (e.g., numbered).
        /// </summary>
        public bool Ordered { get; set; }

        /// <summary>
        /// All list items.
        /// </summary>
        public IEnumerable<MarkdownBlockElementListItem> Items => _items;

        /// <summary>
        /// All list items.
        /// </summary>
        public MarkdownBlockElementList Child => _child;

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => string.Join(" ", _items.Select(e => e.PlainText.Trim())
            .Where(s => !string.IsNullOrWhiteSpace(s)));

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public MarkdownBlockElementList()
        {
        }

        /// <summary>
        /// Adds one or more elements to the list.
        /// </summary>
        /// <param name="items">The elements to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownBlockElementList Add(params MarkdownBlockElementListItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more elements to the list.
        /// </summary>
        /// <param name="items">The elements to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownBlockElementList Add(IEnumerable<MarkdownBlockElementListItem> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one child to the list.
        /// </summary>
        /// <param name="child">The child to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownBlockElementList Add(MarkdownBlockElementList child)
        {
            _child = child;

            return this;
        }
    }
}