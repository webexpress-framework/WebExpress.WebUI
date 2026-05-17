namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents an image element.
    /// </summary>
    public class MarkdownInlineElementImage : MarkdownInlineElement
    {
        /// <summary>
        /// Gets the alternative text for the image.
        /// </summary>
        public string AltText { get; }
        /// <summary>
        /// Gets the image URL.
        /// </summary>
        public string Url { get; }

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => Url;
        
        public MarkdownInlineElementImage(string altText, string url)
        {
            AltText = altText;
            Url = url;
        }
    }
}