using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml.Parser;
using WebExpress.WebUI.WebMarkdown;
using WebExpress.WebUI.WebMarkdown.Element;
using WebExpress.WebUI.WebPdf.Element;

namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Converts the specified <see cref="MarkdownDocument"/> into a <see cref="PdfDocument"/>.
    /// <para>
    /// It is the PDF counterpart of <see cref="MarkdownRendererHtml"/> and works on the same
    /// AST that <see cref="MarkdownParser"/> produces, so a text renders into the same
    /// structure on a page and in a file. Unlike the HTML renderer it keeps the formatting
    /// inside table cells, because a file has no client that could add it back.
    /// </para>
    /// <para>
    /// Plugins become <see cref="PdfBlockElementPlugin"/> and <see cref="PdfInlineElementPlugin"/>
    /// with their name and parameters, so the <see cref="IPdfPlugin"/> an add-on registers in
    /// <see cref="PdfPluginRegistry"/> decides how they look when the document is written.
    /// Without one, an inline plugin is dropped and a block plugin contributes its content.
    /// Raw HTML within the text is read with
    /// <see cref="HtmlParser"/> and converted by <see cref="PdfRendererHtml"/>, so it is
    /// formatted rather than printed as markup.
    /// </para>
    /// </summary>
    public static class PdfRendererMarkdown
    {
        private static readonly PdfTextStyle CodeStyle = new()
        {
            FontFamily = PdfFontFamily.Courier,
            Scale = 0.9f,
            Background = new PdfColor(240, 242, 245)
        };

        /// <summary>
        /// Converts the specified <see cref="MarkdownDocument"/> into a PDF document.
        /// </summary>
        /// <param name="document">The document to convert.</param>
        /// <returns>The PDF document, ready to be configured and saved.</returns>
        public static PdfDocument ConvertToPdf(this MarkdownDocument document)
        {
            return new PdfDocument().Add(ConvertBlocks(document?.Elements ?? []));
        }

        /// <summary>
        /// Parses a markdown text and converts it into a PDF document.
        /// </summary>
        /// <param name="markdown">The markdown text.</param>
        /// <returns>The PDF document, ready to be configured and saved.</returns>
        public static PdfDocument ConvertMarkdownToPdf(string markdown)
        {
            return string.IsNullOrEmpty(markdown)
                ? new PdfDocument()
                : MarkdownParser.Parse(markdown).ConvertToPdf();
        }

        /// <summary>
        /// Converts a sequence of markdown elements in block context. Inline elements between
        /// blocks - the content of a list item, for instance - are collected into paragraphs.
        /// </summary>
        /// <param name="elements">The elements.</param>
        /// <returns>The blocks.</returns>
        internal static List<PdfBlockElement> ConvertBlocks(IEnumerable<IMarkdownElement> elements)
        {
            var blocks = new List<PdfBlockElement>();
            var pending = new List<MarkdownInlineElement>();

            void Flush()
            {
                if (pending.Count > 0)
                {
                    blocks.AddRange(ConvertParagraph(pending));
                    pending.Clear();
                }
            }

            foreach (var element in elements)
            {
                if (element is MarkdownInlineElement inline)
                {
                    pending.Add(inline);
                    continue;
                }

                Flush();
                blocks.AddRange(ConvertBlock(element));
            }

            Flush();

            return blocks;
        }

        /// <summary>
        /// Converts a block element.
        /// </summary>
        /// <param name="element">The element.</param>
        /// <returns>The blocks it becomes.</returns>
        private static IEnumerable<PdfBlockElement> ConvertBlock(IMarkdownElement element)
        {
            switch (element)
            {
                case MarkdownBlockElementHeader header:
                    return [new PdfBlockElementHeading(header.Level, PdfRendererHtml.Trim(ConvertInline(header.Content, PdfTextStyle.Default)))];
                case MarkdownBlockElementParagraph paragraph:
                    return ConvertParagraph(paragraph.Content);
                case MarkdownBlockElementHorizontalRule:
                    return [new PdfBlockElementRule()];
                case MarkdownBlockElementIndent indent:
                    return ConvertBlocks(indent.Content).Select(b =>
                    {
                        if (b is PdfBlockElementParagraph p)
                        {
                            p.Indent += 21f;
                        }

                        return b;
                    }).ToList();
                case MarkdownBlockElementCode code:
                    return [new PdfBlockElementCode(code.Content, code.Language)];
                case MarkdownBlockElementQuote quote:
                    return [new PdfBlockElementQuote(ConvertBlocks(quote.Content))];
                case MarkdownBlockElementCallout callout:
                    return [new PdfBlockElementCallout(callout.CalloutType switch
                    {
                        MarkdownCalloutType.Warning => PdfCalloutType.Warning,
                        MarkdownCalloutType.Danger => PdfCalloutType.Danger,
                        MarkdownCalloutType.Success => PdfCalloutType.Success,
                        _ => PdfCalloutType.Hint
                    }, ConvertBlocks(callout.Content))];
                case MarkdownBlockElementList list:
                    return [ConvertList(list)];
                case MarkdownBlockElementTable table:
                    return [ConvertTable(table)];
                case MarkdownBlockElementPlugin plugin:
                    return [new PdfBlockElementPlugin(plugin.Name, plugin.Parameters, ConvertBlocks(plugin.Content))];
                default:
                    return [];
            }
        }

        /// <summary>
        /// Converts the content of a paragraph. A picture is a block in the PDF model, so a
        /// paragraph that holds one is split around it.
        /// </summary>
        /// <param name="content">The inline content.</param>
        /// <returns>The blocks.</returns>
        private static IEnumerable<PdfBlockElement> ConvertParagraph(IEnumerable<IMarkdownElement> content)
        {
            var blocks = new List<PdfBlockElement>();
            var run = new List<IMarkdownElement>();

            void Flush()
            {
                var inline = ConvertInline(run, PdfTextStyle.Default);

                if (inline.Any(x => x is not PdfInlineElementText text || !string.IsNullOrWhiteSpace(text.Text)))
                {
                    blocks.Add(new PdfBlockElementParagraph(PdfRendererHtml.Trim(inline)));
                }

                run.Clear();
            }

            foreach (var element in content)
            {
                if (element is MarkdownInlineElementImage image)
                {
                    Flush();
                    blocks.Add(new PdfBlockElementImage(image.Url, image.AltText));
                    continue;
                }

                run.Add(element);
            }

            Flush();

            return blocks;
        }

        /// <summary>
        /// Converts a list. A nested list continues the item before it, as in the HTML
        /// renderer, so it becomes a block of that item.
        /// </summary>
        /// <param name="list">The list.</param>
        /// <returns>The list block.</returns>
        private static PdfBlockElementList ConvertList(MarkdownBlockElementList list)
        {
            var first = list.Items.FirstOrDefault();
            var result = new PdfBlockElementList(!list.Ordered
                ? PdfListType.Bullet
                : (first?.OrderedType ?? MarkdownListType.Numeric) switch
                {
                    MarkdownListType.LowerAlpha => PdfListType.LowerAlpha,
                    MarkdownListType.UpperAlpha => PdfListType.UpperAlpha,
                    MarkdownListType.LowerRoman => PdfListType.LowerRoman,
                    MarkdownListType.UpperRoman => PdfListType.UpperRoman,
                    _ => PdfListType.Numeric
                });

            if (list.Ordered && first is not null && first.OrderedNumber != int.MinValue)
            {
                result.Start = first.OrderedNumber;
            }

            var items = list.Items.Select(i => new PdfBlockElementListItem(ConvertBlocks(i.Content))).ToList();

            if (list.Child is not null)
            {
                if (items.Count == 0)
                {
                    items.Add(new PdfBlockElementListItem());
                }

                items[^1].Add(ConvertList(list.Child));
            }

            return result.Add(items);
        }

        /// <summary>
        /// Converts a table. The alignment of a column is declared in its header, so it is
        /// carried to every cell of the column.
        /// </summary>
        /// <param name="table">The table.</param>
        /// <returns>The table block.</returns>
        private static PdfBlockElementTable ConvertTable(MarkdownBlockElementTable table)
        {
            var columns = table.Columns.ToList();
            var rows = table.Rows.Select(r => r.ToList()).ToList();
            var footers = table.Footers.ToList();
            var result = new PdfBlockElementTable { Striped = true };

            PdfBlockElementTableCell Cell(MarkdownBlockElementTableCell cell, int index)
            {
                var align = index < columns.Count ? columns[index].Align : cell.Align;

                return new PdfBlockElementTableCell(ConvertBlocks(cell.Content))
                {
                    Align = align switch
                    {
                        MarkdownCellAlign.Center => PdfTextAlign.Center,
                        MarkdownCellAlign.Right => PdfTextAlign.Right,
                        _ => PdfTextAlign.Left
                    }
                };
            }

            if (columns.Count > 0)
            {
                result.Add(new PdfBlockElementTableRow(columns.Select(Cell)) { Header = true });
            }

            foreach (var row in rows)
            {
                result.Add(new PdfBlockElementTableRow(row.Select(Cell)));
            }

            if (footers.Count > 0)
            {
                result.Add(new PdfBlockElementTableRow(footers.Select(Cell)) { Background = new PdfColor(241, 243, 245) });
            }

            return result;
        }

        /// <summary>
        /// Converts inline elements, carrying the style of the elements they are nested in.
        /// </summary>
        /// <param name="elements">The elements.</param>
        /// <param name="style">The inherited style.</param>
        /// <returns>The inline elements of the PDF model.</returns>
        private static List<PdfInlineElement> ConvertInline(IEnumerable<IMarkdownElement> elements, PdfTextStyle style)
        {
            var result = new List<PdfInlineElement>();

            foreach (var element in elements)
            {
                switch (element)
                {
                    case MarkdownInlineElementBold bold:
                        result.AddRange(ConvertInline(bold.Content, style with { Bold = true }));
                        break;
                    case MarkdownInlineElementItalic italic:
                        result.AddRange(ConvertInline(italic.Content, style with { Italic = true }));
                        break;
                    case MarkdownInlineElementUnderline underline:
                        result.AddRange(ConvertInline(underline.Content, style with { Underline = true }));
                        break;
                    case MarkdownInlineElementStrikethrough strikethrough:
                        result.AddRange(ConvertInline(strikethrough.Content, style with { Strikethrough = true }));
                        break;
                    case MarkdownInlineElementMarked marked:
                        result.AddRange(ConvertInline(marked.Content, style with { Background = new PdfColor(255, 243, 163) }));
                        break;
                    case MarkdownInlineElementCode code:
                        result.Add(new PdfInlineElementText(code.Code, style with
                        {
                            FontFamily = CodeStyle.FontFamily,
                            Scale = style.Scale * CodeStyle.Scale,
                            Background = CodeStyle.Background
                        }));
                        break;
                    case MarkdownInlineElementUrl url:
                        result.Add(new PdfInlineElementText(url.Url, style with { Link = url.Url, Underline = true }));
                        break;
                    case MarkdownInlineElementLink link:
                        result.Add(new PdfInlineElementText(string.IsNullOrEmpty(link.Text) ? link.Url : link.Text, style with { Link = link.Url, Underline = true }));
                        break;
                    case MarkdownInlineElementImage image:
                        // a picture inside a heading or a cell cannot be lifted into a block of
                        // its own, so it is represented by its description
                        result.Add(new PdfInlineElementText($"[{(string.IsNullOrWhiteSpace(image.AltText) ? "Image" : image.AltText)}]", style with { Italic = true }));
                        break;
                    case MarkdownInlineElementCheckbox checkbox:
                        result.Add(new PdfInlineElementCheckbox(checkbox.Value == "true", style));
                        break;
                    case MarkdownInlineElementFootnote footnote:
                        result.Add(new PdfInlineElementText(footnote.Id, style with { Superscript = true }));
                        break;
                    case MarkdownInlineElementHtml html:
                        result.AddRange(PdfRendererHtml.ConvertInline(new HtmlParser().Parse(html.Html ?? ""), style));
                        break;
                    case MarkdownInlineElementPlainText text:
                        result.AddRange(ConvertText(text.Text, style));
                        break;
                    case MarkdownInlineElementPlugin plugin:
                        result.Add(new PdfInlineElementPlugin(plugin.Name, plugin.Parameters, style));
                        break;
                }
            }

            return result;
        }

        /// <summary>
        /// Converts plain text. A line that ends in two spaces or a backslash is a forced
        /// break in markdown; any other line end is a soft break and reads as a space.
        /// </summary>
        /// <param name="text">The text.</param>
        /// <param name="style">The style.</param>
        /// <returns>The inline elements.</returns>
        private static IEnumerable<PdfInlineElement> ConvertText(string text, PdfTextStyle style)
        {
            var lines = (text ?? "").Replace("\r\n", "\n").Split('\n');

            for (var i = 0; i < lines.Length; i++)
            {
                var line = lines[i];
                var last = i == lines.Length - 1;
                var forced = !last && (line.EndsWith("  ") || line.EndsWith('\\'));

                if (forced && line.EndsWith('\\'))
                {
                    line = line[..^1];
                }

                if (line.Length > 0)
                {
                    yield return new PdfInlineElementText(forced ? line.TrimEnd() : line, style);
                }

                if (forced)
                {
                    yield return new PdfInlineElementLineBreak();
                }
                else if (!last)
                {
                    yield return new PdfInlineElementText(" ", style);
                }
            }
        }
    }
}
