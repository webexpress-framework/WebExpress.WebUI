using System.Collections.Generic;
using System.Text;
using WebExpress.WebUI.WebMarkdown.Element;

namespace WebExpress.WebUI.WebMarkdown
{
    /// <summary>
    /// Root node representing an entire Markdown document.
    /// </summary>
    public class MarkdownDocument
    {
        private readonly List<IMarkdownElement> _nodes = [];

        /// <summary>
        /// List of all top-level elements in the Markdown document.
        /// </summary>
        public IEnumerable<IMarkdownElement> Elements => _nodes;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public MarkdownDocument()
        {
        }

        /// <summary>
        /// Adds one or more inline elements to the paragraph.
        /// </summary>
        /// <param name="nodes">The nodes to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownDocument Add(params IMarkdownElement[] nodes)
        {
            _nodes.AddRange(nodes);

            return this;
        }

        /// <summary>
        /// Adds one or more inline elements to the paragraph.
        /// </summary>
        /// <param name="nodes">The nodes to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownDocument Add(IEnumerable<IMarkdownElement> nodes)
        {
            _nodes.AddRange(nodes);

            return this;
        }

        /// <summary>
        /// Returns the plain text representation of this node and its children.
        /// </summary>
        public virtual string GetPlainText()
        {
            // concatenate the plain text of all child elements, separated by newlines, without any quote formatting
            var sb = new StringBuilder();
            foreach (var node in _nodes)
            {
                if (sb.Length > 0)
                {
                    sb.AppendLine();
                }

                sb.Append(node.PlainText);
            }

            return sb.ToString();
        }
    }
}