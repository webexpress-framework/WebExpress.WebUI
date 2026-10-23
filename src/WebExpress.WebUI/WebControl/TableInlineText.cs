using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Wraps formatted content of a table - a cell or a column header - into one line of text.
    /// Header and cells of the table lay out their children as flex items, which would drop
    /// the blanks between a formatted word and the text around it; one span keeps the content
    /// a single item that flows as a line of text.
    /// </summary>
    internal static class TableInlineText
    {
        /// <summary>
        /// Creates the span that holds the content.
        /// </summary>
        /// <param name="content">The formatted content, or null for an empty line.</param>
        /// <param name="class">The css class of the span, which the table script looks for.</param>
        /// <returns>The span.</returns>
        public static HtmlElementTextSemanticsSpan Create(IHtmlNode content, string @class)
        {
            var text = new HtmlElementTextSemanticsSpan()
            {
                Class = @class
            };

            if (content is not null)
            {
                text.Add(content);
            }

            WriteInline(text);

            return text;
        }

        /// <summary>
        /// Marks an element and everything in it to be written without the line break the
        /// serializer keeps between two neighbouring elements. Inside a line of text that
        /// break is a visible blank, which would separate two formatted words (<c>**a**_b_</c>).
        /// </summary>
        /// <param name="node">The node to mark.</param>
        private static void WriteInline(IHtmlNode node)
        {
            switch (node)
            {
                case HtmlElement element:
                    element.Inline = true;
                    foreach (var child in element.Elements)
                    {
                        WriteInline(child);
                    }
                    break;
                case HtmlList list:
                    foreach (var child in list.Elements)
                    {
                        WriteInline(child);
                    }
                    break;
            }
        }
    }
}
