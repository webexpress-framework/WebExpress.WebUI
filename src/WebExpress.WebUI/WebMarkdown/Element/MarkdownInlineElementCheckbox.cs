namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a checkbox element.
    /// </summary>
    public class MarkdownInlineElementCheckbox : MarkdownInlineElement
    {
        /// <summary>
        /// Returns the value of the checkbox (e.g., "true" for checked or "false" for unchecked).
        /// </summary>
        public string Value { get; }

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => $"[{(Value == "true" ? "x" : " ")}]";

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="value">The value of the checkbox ("true" for checked, "false" for unchecked).</param>        
        public MarkdownInlineElementCheckbox(string value)
        {
            Value = value?.Trim()?.ToLowerInvariant(); // Normalize value to lowercase for consistency
        }
    }
}