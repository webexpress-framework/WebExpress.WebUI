using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents italicized text (e.g. *italic* or _italic_) as an inline Markdown element.
    /// </summary>
    public class MarkdownInlineElementItalic : MarkdownInlineElement
    {
        /// <summary>
        /// Gets the collection of inline elements contained within the italic text segment.
        /// </summary>
        public IEnumerable<MarkdownInlineElement> Content { get; } = [];

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => string.Concat(Content.Select(e => e.PlainText));

        /// <summary>
        /// Initializes a new instance of the class with the specified content.
        /// </summary>
        /// <param name="content">The inline elements that are enclosed by the italic formatting.</param>
        public MarkdownInlineElementItalic(IEnumerable<MarkdownInlineElement> content)
        {
            Content = content;
        }
    }
}