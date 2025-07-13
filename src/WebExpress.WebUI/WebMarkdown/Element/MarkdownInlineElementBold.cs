using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a bold inline text segment in a Markdown document.
    /// </summary>
    public class MarkdownInlineElementBold : MarkdownInlineElement
    {
        /// <summary>
        /// Returns the collection of inline elements contained within the bold text segment.
        /// </summary>
        public IEnumerable<IMarkdownElement> Content { get; } = [];

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => string.Concat(Content.Select(e => e.PlainText));

        // <summary>
        /// Initializes a new instance of the class with the specified content.
        /// </summary>
        /// <param name="content">The inline elements that are enclosed by the bold formatting.</param>
        public MarkdownInlineElementBold(IEnumerable<MarkdownInlineElement> content)
        {
            Content = content;
        }
    }
}