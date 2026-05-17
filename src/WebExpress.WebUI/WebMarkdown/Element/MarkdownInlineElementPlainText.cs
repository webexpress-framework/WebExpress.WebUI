namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents plain text (no formatting) as an inline Markdown element.
    /// </summary>
    public class MarkdownInlineElementPlainText : MarkdownInlineElement
    {
        /// <summary>
        /// Gets the plain text content.
        /// </summary>
        public string Text { get; }

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => Text;

        /// <summary>
        /// Initializes a new instance of the class with the specified text.
        /// </summary>
        /// <param name="text">The plain text content.</param>
        public MarkdownInlineElementPlainText(string text) 
        {
            Text = text;
        }
    }
}