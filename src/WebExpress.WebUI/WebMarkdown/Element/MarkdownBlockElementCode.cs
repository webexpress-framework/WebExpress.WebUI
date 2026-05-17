namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a code block element (multi-line code).
    /// </summary>
    public class MarkdownBlockElementCode : MarkdownBlockElement
    {
        /// <summary>
        /// Gets or sets the code content.
        /// </summary>
        public string Content { get; set;}
        
        /// <summary>
        /// Gets or sets the optional programming language.
        /// </summary>
        public string Language { get; set; }

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => Content;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public MarkdownBlockElementCode()
        {
        }
    }
}