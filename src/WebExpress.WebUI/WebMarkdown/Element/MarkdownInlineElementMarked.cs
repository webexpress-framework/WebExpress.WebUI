using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a highlighted inline text segment in a Markdown document, by double equals syntax (==text==).
    /// </summary>
    public class MarkdownInlineElementMarked : MarkdownInlineElement
    {
        /// <summary>
        /// Returns the collection of inline elements that are enclosed by the mark syntax.
        /// </summary>
        public IEnumerable<MarkdownInlineElement> Content { get; } = [];

        /// <summary>
        /// Returns the plain text representation of this marked segment and its children.
        /// </summary>
        public override string PlainText => string.Concat(Content.Select(e => e.PlainText));

        /// <summary>
        /// Initializes a new instance of the <see cref="MarkdownInlineElementMarked"/> class with the specified content.
        /// </summary>
        /// <param name="content">The inline elements to be included within the marked (==highlighted==) block.</param>
        public MarkdownInlineElementMarked(IEnumerable<MarkdownInlineElement> content)
        {
            Content = content;
        }
    }
}