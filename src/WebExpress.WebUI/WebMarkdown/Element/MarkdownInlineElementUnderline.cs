using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents underlined text (e.g. __underline__) as an inline Markdown element.
    /// </summary>
    public class MarkdownInlineElementUnderline : MarkdownInlineElement
    {
        /// <summary>
        /// Returns the collection of inline elements contained within the underlined text segment.
        /// </summary>
        public IEnumerable<MarkdownInlineElement> Content { get; } = [];

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => string.Concat(Content.Select(e => e.PlainText));

        /// <summary>
        /// Initializes a new instance of the class with the specified content.
        /// </summary>
        /// <param name="content">The inline elements that are enclosed by the underline formatting.</param>
        public MarkdownInlineElementUnderline(IEnumerable<MarkdownInlineElement> content)
        {
            Content = content;
        }
    }
}