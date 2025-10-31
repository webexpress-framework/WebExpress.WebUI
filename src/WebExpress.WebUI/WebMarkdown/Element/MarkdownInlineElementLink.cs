namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a link element.
    /// </summary>
    public class MarkdownInlineElementLink : MarkdownInlineElement
    {
        /// <summary>
        /// Gets the link text.
        /// </summary>
        public string Text { get; }
        /// <summary>
        /// Gets the link URL.
        /// </summary>
        public string Url { get; }

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => Url;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="text">The text of the link.</param>        
        /// <param name="url">The url of the link.</param>    
        public MarkdownInlineElementLink(string text, string url)
        {
            Text = text;
            Url = url;
        }
    }
}