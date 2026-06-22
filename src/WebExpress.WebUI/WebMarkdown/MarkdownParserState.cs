namespace WebExpress.WebUI.WebMarkdown
{
    /// <summary>
    /// The states of the Markdown parser's state machine while it reads through the source. They
    /// track what the parser is currently in the middle of — for example a table row or cell, or
    /// the individual steps of parsing a link — so it knows how to interpret the next token.
    /// </summary>
    public enum MarkdownParserState
    {
        Init,
        TableRow,
        TableCell,
        MarkdownLinkStart,
        MarkdownLinkText,
        MarkdownLinkCloseBracket,
        MarkdownLinkOpenParen,
        MarkdownLinkUrl,
        MarkdownLinkEnd,
        Done
    }
}