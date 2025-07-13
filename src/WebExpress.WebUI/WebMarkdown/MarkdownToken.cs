namespace WebExpress.WebUI.WebMarkdown
{
    /// <summary>
    /// Represents a single token in Markdown parsing.
    /// </summary>
    public class MarkdownToken
    {
        /// <summary>
        /// Type of the token (e.g. LBracket, Text, CodeMarker, etc.).
        /// </summary>
        public MarkdownTokenType Type { get; }

        /// <summary>
        /// The text value of the token.
        /// </summary>
        public string Value { get; }

        /// <summary>
        /// An extended parameter of the token.
        /// </summary>
        public string Parameter { get; }

        /// <summary>
        /// The starting position of the token in the original string.
        /// </summary>
        public int Position { get; }

        /// <summary>
        /// Indicates how many characters the token consists of (e.g. for ** or ___).
        /// For single-character tokens, this is 1.
        /// </summary>
        public int Count { get; }

        /// <summary>
        /// Creates a new MarkdownToken.
        /// </summary>
        /// <param name="type">Type of the token.</param>
        /// <param name="value">Text value of the token.</param>
        /// <param name="position">Starting position in the input text.</param>
        public MarkdownToken(MarkdownTokenType type, string value, int position)
        {
            Type = type;
            Value = value;
            Position = position;
            Count = value?.Length ?? 0;
        }

        /// <summary>
        /// Creates a new MarkdownToken.
        /// </summary>
        /// <param name="type">Type of the token.</param>
        /// <param name="value">Text value of the token.</param>
        /// <param name="position">Starting position in the input text.</param>
        /// <param name="count">The value characters count.</param>
        public MarkdownToken(MarkdownTokenType type, string value, int position, int count)
        {
            Type = type;
            Value = value;
            Position = position;
            Count = count;
        }

        /// <summary>
        /// Creates a new MarkdownToken.
        /// </summary>
        /// <param name="type">Type of the token.</param>
        /// <param name="value">Text value of the token.</param>
        /// <param name="parameter">An extended parameter of the token.</param>
        /// <param name="position">Starting position in the input text.</param>
        public MarkdownToken(MarkdownTokenType type, string value, string parameter, int position)
        {
            Type = type;
            Value = value;
            Parameter = parameter;
            Position = position;
            Count = value?.Length ?? 0;
        }

        /// <summary>
        /// Creates a new MarkdownToken.
        /// </summary>
        /// <param name="type">Type of the token.</param>
        /// <param name="value">Text value of the token.</param>
        /// <param name="parameter">An extended parameter of the token.</param>
        /// <param name="position">Starting position in the input text.</param>
        /// <param name="count">The value characters count.</param>
        public MarkdownToken(MarkdownTokenType type, string value, string parameter, int position, int count)
        {
            Type = type;
            Value = value;
            Parameter = parameter;
            Position = position;
            Count = count;
        }

        /// <summary>
        /// Returns a string representation of the MarkdownToken, including its type, value, and position.
        /// Useful for debugging and logging purposes.
        /// </summary>
        public override string ToString()
        {
            return $"{Type}: '{Value}' (pos {Position})";
        }
    }
}