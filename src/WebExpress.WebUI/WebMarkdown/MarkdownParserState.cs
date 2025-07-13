namespace WebExpress.WebUI.WebMarkdown
{
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