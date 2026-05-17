namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Common interface for all Markdown AST nodes.
    /// </summary>
    public interface IMarkdownElement
    {
        /// <summary>
        /// Gets the plain text representation of this node and its children.
        /// </summary>
        string PlainText { get; }
    }
}