namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a code snippet as an inline Markdown element.
    /// </summary>
    public class MarkdownInlineElementCode : MarkdownInlineElement
    {
        /// <summary>
        /// Returns the code content of this Markdown element.
        /// </summary>
        public string Code { get; }

        /// <summary>
        /// Returns the plain text representation of this code element.
        /// </summary>
        public override string PlainText => Code;

        /// <summary>
        /// Initializes a new instance of the <see cref="MarkdownInlineElementCode"/> class.
        /// </summary>
        /// <param name="code">The code content.</param>
        public MarkdownInlineElementCode(string code)
        {
            Code = code ?? "";
        }
    }
}