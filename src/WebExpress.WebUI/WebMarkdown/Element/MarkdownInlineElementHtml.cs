namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a html element.
    /// </summary>
    public class MarkdownInlineElementHtml : MarkdownInlineElement
    {
        /// <summary>
        /// Gets the HTML content of the element.
        /// </summary>
        public string Html { get; }

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => Html;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="html">The HTML content of the element.</param>                
        public MarkdownInlineElementHtml(string html)
        {
            Html = html;
        }
    }
}