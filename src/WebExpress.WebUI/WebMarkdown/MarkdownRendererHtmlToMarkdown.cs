using System.Collections.Generic;
using System.Linq;
using System.Text;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebHtml.Parser;
using WebExpress.WebUI.WebMarkdown.Element;

namespace WebExpress.WebUI.WebMarkdown
{
    /// <summary>
    /// Converts HTML into Markdown, closing the round trip the other renderers only cover in
    /// one direction: <see cref="MarkdownParser"/> reads Markdown into the AST,
    /// <see cref="MarkdownRendererHtml"/> writes the AST as HTML, and
    /// <see cref="MarkdownRendererMarkdown"/> writes it back as Markdown.
    /// <para>
    /// The conversion goes through the AST rather than writing text directly, so all the
    /// decisions about escaping, list indentation, ordered numbering and table alignment stay
    /// in <see cref="MarkdownRendererMarkdown"/> - the one place that already makes them.
    /// </para>
    /// <para>
    /// The reading of the HTML is left to <see cref="HtmlParser"/>, which maps every known tag
    /// to its own node class. That is what this renderer matches on: an element the parser
    /// does not know arrives as a plain <see cref="HtmlElement"/> whose tag name it does not
    /// expose, and is therefore treated as a transparent wrapper around its content.
    /// </para>
    /// <para>
    /// Markup that Markdown cannot express - a coloured span, an inline style - loses the
    /// wrapper and keeps the text. This is deliberate: the point of converting to Markdown is
    /// a portable document, and carrying the markup along in raw HTML would only defer the
    /// question. Callers converting the working surface of the editor should strip its
    /// scaffolding first; this renderer knows nothing about it.
    /// </para>
    /// </summary>
    public static class MarkdownRendererHtmlToMarkdown
    {
        /// <summary>
        /// Reads an HTML string and converts it into Markdown.
        /// </summary>
        /// <param name="html">The HTML to convert.</param>
        /// <returns>The Markdown representation, or an empty string for no input.</returns>
        public static string ConvertHtmlToMarkdown(string html)
        {
            if (string.IsNullOrEmpty(html))
            {
                return string.Empty;
            }

            return new HtmlParser().Parse(html).ConvertToMarkdown();
        }

        /// <summary>
        /// Converts parsed HTML nodes into Markdown.
        /// </summary>
        /// <param name="nodes">The nodes as <see cref="HtmlParser"/> returns them.</param>
        /// <returns>The Markdown representation.</returns>
        public static string ConvertToMarkdown(this IEnumerable<IHtmlNode> nodes)
        {
            return nodes.ConvertToDocument().ConvertToMarkdown();
        }

        /// <summary>
        /// Converts parsed HTML nodes into the Markdown AST, for a caller that wants to
        /// inspect or re-render the document rather than only serialize it.
        /// </summary>
        /// <param name="nodes">The nodes as <see cref="HtmlParser"/> returns them.</param>
        /// <returns>The document.</returns>
        public static MarkdownDocument ConvertToDocument(this IEnumerable<IHtmlNode> nodes)
        {
            var document = new MarkdownDocument();

            if (nodes is not null)
            {
                document.Add(ConvertBlocks(nodes));
            }

            return document;
        }

        /// <summary>
        /// Converts a sequence of nodes in block context. Inline content between blocks is
        /// collected into a paragraph, so text that a document leaves at the top level does
        /// not fall out of the conversion.
        /// </summary>
        /// <param name="nodes">The nodes to convert.</param>
        /// <returns>The block elements.</returns>
        private static IEnumerable<IMarkdownElement> ConvertBlocks(IEnumerable<IHtmlNode> nodes)
        {
            var blocks = new List<IMarkdownElement>();
            var pending = new List<MarkdownInlineElement>();

            void FlushPending()
            {
                if (pending.Any(x => !IsBlank(x)))
                {
                    blocks.Add(new MarkdownBlockElementParagraph(pending.ToList()));
                }

                pending.Clear();
            }

            foreach (var node in nodes)
            {
                var block = ConvertBlock(node);

                if (block is not null)
                {
                    FlushPending();
                    blocks.Add(block);
                }
                else
                {
                    pending.AddRange(ConvertInline(node));
                }
            }

            FlushPending();

            return blocks;
        }

        /// <summary>
        /// Converts a single node in block context.
        /// </summary>
        /// <param name="node">The node to convert.</param>
        /// <returns>The block element, or null when the node is inline content.</returns>
        private static IMarkdownElement ConvertBlock(IHtmlNode node)
        {
            switch (node)
            {
                case HtmlElementSectionH1 h: return new MarkdownBlockElementHeader(1, ConvertInline(h));
                case HtmlElementSectionH2 h: return new MarkdownBlockElementHeader(2, ConvertInline(h));
                case HtmlElementSectionH3 h: return new MarkdownBlockElementHeader(3, ConvertInline(h));
                case HtmlElementSectionH4 h: return new MarkdownBlockElementHeader(4, ConvertInline(h));
                case HtmlElementSectionH5 h: return new MarkdownBlockElementHeader(5, ConvertInline(h));
                case HtmlElementSectionH6 h: return new MarkdownBlockElementHeader(6, ConvertInline(h));
                case HtmlElementTextContentP p: return ConvertParagraph(p);
                case HtmlElementTextContentHr: return new MarkdownBlockElementHorizontalRule();
                case HtmlElementTextContentPre pre: return ConvertCode(pre);
                case HtmlElementTextContentBlockquote quote:
                    return new MarkdownBlockElementQuote(ConvertBlocks(Children(quote)));
                case HtmlElementTextContentUl list: return ConvertList(list, false);
                case HtmlElementTextContentOl list: return ConvertList(list, true);
                case HtmlElementTableTable table: return ConvertTable(table);
                default: return null;
            }
        }

        /// <summary>
        /// Converts a paragraph. A paragraph holding nothing but a line break is the filler
        /// the editor keeps around non-editable blocks, and carries nothing for a reader.
        /// </summary>
        /// <param name="paragraph">The paragraph element.</param>
        /// <returns>The block element, or null when the paragraph is empty.</returns>
        private static IMarkdownElement ConvertParagraph(HtmlElementTextContentP paragraph)
        {
            var content = ConvertInline(paragraph);

            return content.All(IsBlank) ? null : new MarkdownBlockElementParagraph(content);
        }

        /// <summary>
        /// Converts a preformatted block. The language is taken from the "language-x" class of
        /// the nested code element, which is where highlighters put it.
        /// </summary>
        /// <param name="pre">The preformatted element.</param>
        /// <returns>The code block.</returns>
        private static IMarkdownElement ConvertCode(HtmlElementTextContentPre pre)
        {
            var code = Children(pre).OfType<HtmlElementTextSemanticsCode>().FirstOrDefault();
            var language = (code?.Class ?? pre.Class ?? "")
                .Split(' ')
                .FirstOrDefault(x => x.StartsWith("language-"))?
                .Substring("language-".Length);

            return new MarkdownBlockElementCode
            {
                Content = PlainText(pre).Trim('\r', '\n'),
                Language = language
            };
        }

        /// <summary>
        /// Converts a list. A list nested inside an item becomes the child list of the AST,
        /// which is how the Markdown renderer indents it.
        /// </summary>
        /// <param name="element">The list element.</param>
        /// <param name="ordered">Whether the list is numbered.</param>
        /// <returns>The list element.</returns>
        private static IMarkdownElement ConvertList(HtmlElement element, bool ordered)
        {
            var list = new MarkdownBlockElementList { Ordered = ordered };

            foreach (var item in Children(element).OfType<HtmlElementTextContentLi>())
            {
                var nested = Children(item)
                    .FirstOrDefault(x => x is HtmlElementTextContentUl or HtmlElementTextContentOl);
                var own = Children(item).Where(x => x != nested);

                list.Add(new MarkdownBlockElementListItem(0, ConvertBlocks(own)));

                if (nested is HtmlElement nestedList)
                {
                    var child = ConvertList(nestedList, nested is HtmlElementTextContentOl);
                    if (child is MarkdownBlockElementList childList)
                    {
                        list.Add(childList);
                    }
                }
            }

            return list;
        }

        /// <summary>
        /// Converts a table. Markdown tables need a header row, so a table without one is
        /// given the first body row as its header rather than being dropped.
        /// </summary>
        /// <param name="element">The table element.</param>
        /// <returns>The table element.</returns>
        private static IMarkdownElement ConvertTable(HtmlElementTableTable element)
        {
            var table = new MarkdownBlockElementTable();
            var rows = Descendants(element).OfType<HtmlElementTableTr>().ToList();
            var header = rows.FirstOrDefault(r => Children(r).OfType<HtmlElementTableTh>().Any())
                ?? rows.FirstOrDefault();

            if (header is not null)
            {
                foreach (var cell in Cells(header))
                {
                    table.AddColumn(new MarkdownBlockElementTableCell(ConvertInline(cell)));
                }
            }

            foreach (var row in rows.Where(r => r != header))
            {
                table.AddRow(Cells(row)
                    .Select(cell => new MarkdownBlockElementTableCell(ConvertInline(cell)))
                    .ToList());
            }

            return table;
        }

        /// <summary>
        /// Returns the header and data cells of a row, in document order.
        /// </summary>
        /// <param name="row">The row element.</param>
        /// <returns>The cells.</returns>
        private static IEnumerable<HtmlElement> Cells(HtmlElementTableTr row)
        {
            return Children(row)
                .Where(x => x is HtmlElementTableTh or HtmlElementTableTd)
                .Cast<HtmlElement>();
        }

        /// <summary>
        /// Converts the children of an element in inline context.
        /// </summary>
        /// <param name="element">The element whose content is converted.</param>
        /// <returns>The inline elements.</returns>
        private static List<MarkdownInlineElement> ConvertInline(HtmlElement element)
        {
            return Children(element).SelectMany(ConvertInline).ToList();
        }

        /// <summary>
        /// Converts a single node in inline context. An element Markdown has no notation for
        /// contributes its content without the wrapper.
        /// </summary>
        /// <param name="node">The node to convert.</param>
        /// <returns>The inline elements.</returns>
        private static IEnumerable<MarkdownInlineElement> ConvertInline(IHtmlNode node)
        {
            switch (node)
            {
                case HtmlText text:
                    return [new MarkdownInlineElementPlainText(text.Value ?? "")];
                case HtmlElementTextSemanticsBr:
                    // two trailing spaces are what makes a line break a break in markdown
                    return [new MarkdownInlineElementPlainText("  \n")];
                case HtmlElementTextSemanticsStrong strong:
                    return [new MarkdownInlineElementBold(ConvertInline(strong))];
                case HtmlElementTextSemanticsB bold:
                    return [new MarkdownInlineElementBold(ConvertInline(bold))];
                case HtmlElementTextSemanticsEm em:
                    return [new MarkdownInlineElementItalic(ConvertInline(em))];
                case HtmlElementTextSemanticsI italic:
                    return [new MarkdownInlineElementItalic(ConvertInline(italic))];
                case HtmlElementTextSemanticsU underline:
                    return [new MarkdownInlineElementUnderline(ConvertInline(underline))];
                case HtmlElementTextSemanticsS strike:
                    return [new MarkdownInlineElementStrikethrough(ConvertInline(strike))];
                case HtmlElementEditDel del:
                    return [new MarkdownInlineElementStrikethrough(ConvertInline(del))];
                case HtmlElementTextSemanticsMark mark:
                    return [new MarkdownInlineElementMarked(ConvertInline(mark))];
                case HtmlElementTextSemanticsCode code:
                    return [new MarkdownInlineElementCode(PlainText(code))];
                case HtmlElementTextSemanticsA link:
                    return [new MarkdownInlineElementLink(PlainText(link), link.Href ?? "")];
                case HtmlElementMultimediaImg image:
                    return [new MarkdownInlineElementImage(image.Alt ?? "", image.Src ?? "")];
                case HtmlElement element:
                    return ConvertInline(element);
                default:
                    return [];
            }
        }

        /// <summary>
        /// Returns the child nodes of an element.
        /// </summary>
        /// <param name="element">The element.</param>
        /// <returns>The children, or an empty sequence.</returns>
        private static IEnumerable<IHtmlNode> Children(HtmlElement element)
        {
            return element?.Elements ?? [];
        }

        /// <summary>
        /// Returns all descendant nodes of an element, in document order.
        /// </summary>
        /// <param name="element">The element.</param>
        /// <returns>The descendants.</returns>
        private static IEnumerable<IHtmlNode> Descendants(HtmlElement element)
        {
            foreach (var child in Children(element))
            {
                yield return child;

                if (child is HtmlElement nested)
                {
                    foreach (var descendant in Descendants(nested))
                    {
                        yield return descendant;
                    }
                }
            }
        }

        /// <summary>
        /// Returns the concatenated text of a node and its descendants.
        /// </summary>
        /// <param name="node">The node.</param>
        /// <returns>The text.</returns>
        private static string PlainText(IHtmlNode node)
        {
            switch (node)
            {
                case HtmlText text:
                    return text.Value ?? "";
                case HtmlElement element:
                    var sb = new StringBuilder();
                    foreach (var child in Children(element))
                    {
                        sb.Append(PlainText(child));
                    }
                    return sb.ToString();
                default:
                    return "";
            }
        }

        /// <summary>
        /// Returns whether an inline element carries nothing but whitespace.
        /// </summary>
        /// <param name="element">The element to test.</param>
        /// <returns>True when it contributes nothing.</returns>
        private static bool IsBlank(IMarkdownElement element)
        {
            return element is MarkdownInlineElementPlainText text
                && string.IsNullOrWhiteSpace(text.Text);
        }
    }
}
