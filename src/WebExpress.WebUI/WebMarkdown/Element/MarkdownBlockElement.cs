namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Base class for all block elements in a Markdown document.
    /// </summary>
    public abstract class MarkdownBlockElement : IMarkdownElement 
    { 
        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public virtual string PlainText => string.Empty;
    }
}