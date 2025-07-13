namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a recognized URL as an inline element in the Markdown parser.
    /// </summary>
    public class MarkdownInlineElementUrl : MarkdownInlineElement
    {
        /// <summary>
        /// Returns the address of the URL (e.g. "https://example.com").
        /// </summary>
        public string Url { get; }

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => Url;

        /// <summary>
        /// Creates a new instance of the Url class.
        /// </summary>
        /// <param name="address">The found URL.</param>
        public MarkdownInlineElementUrl(string address)
        {
            Url = address;
        }
    }
}