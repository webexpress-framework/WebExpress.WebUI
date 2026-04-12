using System.Collections.Generic;
using System.Linq;
using System.Text;
using WebExpress.WebUI.WebMarkdown.Element;

namespace WebExpress.WebUI.WebMarkdown
{
    /// <summary>
    /// Converts a <see cref="MarkdownDocument"/> (AST) back into valid Markdown text.
    /// This enables a round-trip between Markdown, the internal AST, HTML, and back to Markdown.
    /// </summary>
    public static class MarkdownRendererMarkdown
    {
        private const string InlinePluginOpen = "{{";
        private const string InlinePluginClose = "}}";
        private const string BlockPluginOpen = "{{% ";
        private const string BlockPluginClose = " %}}";
        private const string BlockPluginCloseSlash = "{{% /";

        /// <summary>
        /// Converts the specified <see cref="MarkdownDocument"/> back into a Markdown string.
        /// </summary>
        /// <param name="document">The document to convert. Cannot be null.</param>
        /// <returns>A string containing the Markdown representation of the document.</returns>
        public static string ConvertToMarkdown(this MarkdownDocument document)
        {
            if (document is null)
            {
                return string.Empty;
            }

            var sb = new StringBuilder();
            ConvertElements(document.Elements, sb);

            return sb.ToString().TrimEnd();
        }

        /// <summary>
        /// Converts a sequence of markdown elements to their Markdown text representation.
        /// </summary>
        /// <param name="elements">The elements to convert.</param>
        /// <param name="sb">The string builder to append Markdown text to.</param>
        private static void ConvertElements(IEnumerable<IMarkdownElement> elements, StringBuilder sb)
        {
            var isFirst = true;

            foreach (var element in elements)
            {
                if (!isFirst && element is MarkdownBlockElement)
                {
                    sb.AppendLine();
                }

                ConvertElement(element, sb);
                isFirst = false;
            }
        }

        /// <summary>
        /// Converts a single markdown element to its Markdown text representation.
        /// </summary>
        /// <param name="element">The element to convert.</param>
        /// <param name="sb">The string builder to append Markdown text to.</param>
        private static void ConvertElement(IMarkdownElement element, StringBuilder sb)
        {
            switch (element)
            {
                case MarkdownBlockElementHeader header:
                    ConvertHeader(header, sb);
                    break;
                case MarkdownBlockElementHorizontalRule:
                    sb.AppendLine("---");
                    break;
                case MarkdownBlockElementCode code:
                    ConvertCodeBlock(code, sb);
                    break;
                case MarkdownBlockElementQuote quote:
                    ConvertQuote(quote, sb);
                    break;
                case MarkdownBlockElementCallout callout:
                    ConvertCallout(callout, sb);
                    break;
                case MarkdownBlockElementList list:
                    ConvertList(list, sb, 0);
                    break;
                case MarkdownBlockElementTable table:
                    ConvertTable(table, sb);
                    break;
                case MarkdownBlockElementIndent indent:
                    ConvertIndent(indent, sb);
                    break;
                case MarkdownBlockElementPlugin blockPlugin:
                    ConvertBlockPlugin(blockPlugin, sb);
                    break;
                case MarkdownBlockElementParagraph paragraph:
                    ConvertParagraph(paragraph, sb);
                    break;
                case MarkdownInlineElement inline:
                    ConvertInlineElement(inline, sb);
                    break;
            }
        }

        /// <summary>
        /// Converts a header element to Markdown.
        /// </summary>
        /// <param name="header">The header element.</param>
        /// <param name="sb">The string builder.</param>
        private static void ConvertHeader(MarkdownBlockElementHeader header, StringBuilder sb)
        {
            sb.Append(new string('#', header.Level));
            sb.Append(' ');
            ConvertInlineElements(header.Content, sb);
            sb.AppendLine();
        }

        /// <summary>
        /// Converts a code block element to Markdown.
        /// </summary>
        /// <param name="code">The code block element.</param>
        /// <param name="sb">The string builder.</param>
        private static void ConvertCodeBlock(MarkdownBlockElementCode code, StringBuilder sb)
        {
            sb.Append("```");
            if (!string.IsNullOrWhiteSpace(code.Language))
            {
                sb.Append(code.Language);
            }

            sb.AppendLine();
            sb.AppendLine(code.Content);
            sb.AppendLine("```");
        }

        /// <summary>
        /// Converts a blockquote element to Markdown.
        /// </summary>
        /// <param name="quote">The quote element.</param>
        /// <param name="sb">The string builder.</param>
        private static void ConvertQuote(MarkdownBlockElementQuote quote, StringBuilder sb)
        {
            var innerSb = new StringBuilder();
            ConvertElements(quote.Content, innerSb);

            var lines = innerSb.ToString().TrimEnd().Split('\n');
            foreach (var line in lines)
            {
                sb.Append("> ");
                sb.AppendLine(line);
            }
        }

        /// <summary>
        /// Converts a callout element to Markdown.
        /// </summary>
        /// <param name="callout">The callout element.</param>
        /// <param name="sb">The string builder.</param>
        private static void ConvertCallout(MarkdownBlockElementCallout callout, StringBuilder sb)
        {
            var prefix = callout.CalloutType switch
            {
                MarkdownCalloutType.Hint => ">? ",
                MarkdownCalloutType.Warning => ">! ",
                MarkdownCalloutType.Danger => ">!! ",
                MarkdownCalloutType.Success => ">* ",
                _ => "> "
            };

            var innerSb = new StringBuilder();
            ConvertElements(callout.Content, innerSb);

            var lines = innerSb.ToString().TrimEnd().Split('\n');
            foreach (var line in lines)
            {
                sb.Append(prefix);
                sb.AppendLine(line);
            }
        }

        /// <summary>
        /// Converts a list element to Markdown with proper indentation and markers.
        /// </summary>
        /// <param name="list">The list element.</param>
        /// <param name="sb">The string builder.</param>
        /// <param name="indent">The current indentation level.</param>
        private static void ConvertList(MarkdownBlockElementList list, StringBuilder sb, int indent)
        {
            var indentStr = new string(' ', indent * 2);
            var index = 1;

            foreach (var item in list.Items)
            {
                sb.Append(indentStr);

                if (list.Ordered)
                {
                    var number = item.OrderedNumber >= 0 ? item.OrderedNumber : index;
                    sb.Append($"{number}. ");
                    index++;
                }
                else
                {
                    sb.Append("- ");
                }

                var innerSb = new StringBuilder();
                ConvertElements(item.Content, innerSb);
                sb.AppendLine(innerSb.ToString().TrimEnd());
            }

            if (list.Child is not null && list.Child.Items.Any())
            {
                ConvertList(list.Child, sb, indent + 1);
            }
        }

        /// <summary>
        /// Converts a table element to Markdown.
        /// </summary>
        /// <param name="table">The table element.</param>
        /// <param name="sb">The string builder.</param>
        private static void ConvertTable(MarkdownBlockElementTable table, StringBuilder sb)
        {
            // write header row
            if (table.Columns.Any())
            {
                sb.Append("| ");
                sb.Append(string.Join(" | ", table.Columns.Select(c => c.PlainText)));
                sb.AppendLine(" |");

                // write separator
                sb.Append("| ");
                sb.Append(string.Join(" | ", table.Columns.Select(_ => "---")));
                sb.AppendLine(" |");
            }

            // write data rows
            foreach (var row in table.Rows)
            {
                sb.Append("| ");
                sb.Append(string.Join(" | ", row.Select(c => c.PlainText)));
                sb.AppendLine(" |");
            }
        }

        /// <summary>
        /// Converts an indent element to Markdown.
        /// </summary>
        /// <param name="indent">The indent element.</param>
        /// <param name="sb">The string builder.</param>
        private static void ConvertIndent(MarkdownBlockElementIndent indent, StringBuilder sb)
        {
            var innerSb = new StringBuilder();
            ConvertElements(indent.Content, innerSb);

            var lines = innerSb.ToString().TrimEnd().Split('\n');
            foreach (var line in lines)
            {
                sb.Append("  ");
                sb.AppendLine(line);
            }
        }

        /// <summary>
        /// Converts a paragraph element to Markdown.
        /// </summary>
        /// <param name="paragraph">The paragraph element.</param>
        /// <param name="sb">The string builder.</param>
        private static void ConvertParagraph(MarkdownBlockElementParagraph paragraph, StringBuilder sb)
        {
            ConvertInlineElements(paragraph.Content, sb);
            sb.AppendLine();
        }

        /// <summary>
        /// Converts a block plugin element to Markdown.
        /// </summary>
        /// <param name="plugin">The block plugin element.</param>
        /// <param name="sb">The string builder.</param>
        private static void ConvertBlockPlugin(MarkdownBlockElementPlugin plugin, StringBuilder sb)
        {
            var paramStr = FormatPluginParameters(plugin.Parameters);
            sb.AppendLine($"{BlockPluginOpen}{plugin.Name}{paramStr}{BlockPluginClose}");

            if (plugin.Content.Any())
            {
                ConvertElements(plugin.Content, sb);
                sb.AppendLine();
            }

            sb.AppendLine($"{BlockPluginCloseSlash}{plugin.Name}{BlockPluginClose}");        }

        /// <summary>
        /// Converts a collection of inline elements to Markdown text.
        /// </summary>
        /// <param name="elements">The inline elements to convert.</param>
        /// <param name="sb">The string builder.</param>
        private static void ConvertInlineElements(IEnumerable<IMarkdownElement> elements, StringBuilder sb)
        {
            foreach (var element in elements)
            {
                ConvertInlineElement(element, sb);
            }
        }

        /// <summary>
        /// Converts a single inline element to its Markdown text representation.
        /// </summary>
        /// <param name="element">The inline element to convert.</param>
        /// <param name="sb">The string builder.</param>
        private static void ConvertInlineElement(IMarkdownElement element, StringBuilder sb)
        {
            switch (element)
            {
                case MarkdownInlineElementPlainText text:
                    sb.Append(text.Text);
                    break;
                case MarkdownInlineElementBold bold:
                    sb.Append("**");
                    ConvertInlineElements(bold.Content, sb);
                    sb.Append("**");
                    break;
                case MarkdownInlineElementItalic italic:
                    sb.Append("*");
                    ConvertInlineElements(italic.Content, sb);
                    sb.Append("*");
                    break;
                case MarkdownInlineElementUnderline underline:
                    sb.Append("_");
                    ConvertInlineElements(underline.Content, sb);
                    sb.Append("_");
                    break;
                case MarkdownInlineElementStrikethrough strikethrough:
                    sb.Append("~~");
                    ConvertInlineElements(strikethrough.Content, sb);
                    sb.Append("~~");
                    break;
                case MarkdownInlineElementMarked marked:
                    sb.Append("==");
                    ConvertInlineElements(marked.Content, sb);
                    sb.Append("==");
                    break;
                case MarkdownInlineElementCode code:
                    sb.Append('`');
                    sb.Append(code.Code);
                    sb.Append('`');
                    break;
                case MarkdownInlineElementUrl url:
                    sb.Append(url.Url);
                    break;
                case MarkdownInlineElementLink link:
                    sb.Append($"[{link.Text}]({link.Url})");
                    break;
                case MarkdownInlineElementImage image:
                    sb.Append($"![{image.AltText}]({image.Url})");
                    break;
                case MarkdownInlineElementHtml html:
                    sb.Append(html.Html);
                    break;
                case MarkdownInlineElementCheckbox checkbox:
                    sb.Append(checkbox.Value == "true" ? "[X]" : "[ ]");
                    break;
                case MarkdownInlineElementFootnote footnote:
                    sb.Append($"[^{footnote.Id}]");
                    break;
                case MarkdownInlineElementPlugin inlinePlugin:
                    sb.Append($"{InlinePluginOpen}{inlinePlugin.Name}{FormatPluginParameters(inlinePlugin.Parameters)}{InlinePluginClose}");
                    break;
            }
        }

        /// <summary>
        /// Formats plugin parameters as a string for Markdown output.
        /// </summary>
        /// <param name="parameters">The plugin parameters.</param>
        /// <returns>A formatted parameter string.</returns>
        private static string FormatPluginParameters(IReadOnlyDictionary<string, string> parameters)
        {
            if (parameters is null || parameters.Count == 0)
            {
                return string.Empty;
            }

            var sb = new StringBuilder();
            foreach (var param in parameters)
            {
                sb.Append($" {param.Key}=\"{param.Value}\"");
            }

            return sb.ToString();
        }
    }
}
