namespace WebExpress.WebUI.WebMarkdown
{
    /// <summary>
    /// Defines the types of callout blocks supported in Markdown.
    /// Callouts are visual containers used to highlight specific types of information.
    /// </summary>
    public enum MarkdownCalloutType
    {
        /// <summary>
        /// Hint – Provides helpful or supportive information to assist the reader.
        /// Typically used for tips, context, or advice.
        /// </summary>
        Hint,

        /// <summary>
        /// Warning – Highlights cautionary messages that require attention.
        /// Used to inform users of potential issues or risks.
        /// </summary>
        Warning,

        /// <summary>
        /// Error – Marks critical problems or fatal conditions.
        /// Emphasizes important failures, exceptions, or blockers.
        /// </summary>
        Danger,

        /// <summary>
        /// Success – Celebrates completed actions or positive outcomes.
        /// Used to reinforce achievements, confirmations, or best practices.
        /// </summary>
        Success
    }

}