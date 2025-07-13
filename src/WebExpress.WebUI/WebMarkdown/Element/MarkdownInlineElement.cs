namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Base class for all inline elements in a Markdown document.
    /// </summary>
    public abstract class MarkdownInlineElement : IMarkdownElement 
    { 
        /// <summary>
        /// Returns the plain text representation of this inline element and its children.
        /// </summary>
        public virtual string PlainText => string.Empty;
    }
}