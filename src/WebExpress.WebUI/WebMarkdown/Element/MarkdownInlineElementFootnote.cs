namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a footnote element.
    /// </summary>
    public class MarkdownInlineElementFootnote : MarkdownInlineElement
    {
        /// <summary>
        /// Gets the footnote ID.
        /// </summary>
        public string Id { get; }

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => $"[^{Id}]";

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The ID of the footnote.</param>        

        public MarkdownInlineElementFootnote(string id)
        {
            Id = id;
        }
    }
}