using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebHtml.Parser;
using WebExpress.WebUI.WebPdf.Element;

namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Converts HTML into a <see cref="PdfDocument"/>.
    /// <para>
    /// Like <see cref="WebMarkdown.MarkdownRendererHtmlToMarkdown"/> it reads the nodes
    /// <see cref="HtmlParser"/> produces and matches on their classes; an element the parser
    /// does not know is a transparent wrapper around its content. Unlike the conversion to
    /// Markdown it keeps what a stored editor value says about appearance - text and
    /// background colors, font sizes, alignment, indentation, column widths and the regions
    /// of a row - because a PDF can show all of it.
    /// </para>
    /// <para>
    /// Only the inline <c>style</c> attribute and a few well known classes are read; there is
    /// no style sheet. That covers what the editor writes, and keeps a stored value from
    /// pulling in rules it does not carry itself. Scripts, styles, forms and embedded content
    /// are dropped. It knows nothing about the editor: a stored editor value goes through
    /// <see cref="WebEditor.EditorContent.ConvertToPdf"/>, which removes the editing
    /// scaffolding by the rules of the reading view before handing the document over.
    /// </para>
    /// </summary>
    public static class PdfRendererHtml
    {
        private static readonly PdfColor MarkColor = new(255, 243, 163);
        private static readonly PdfColor CodeColor = new(240, 242, 245);

        /// <summary>
        /// The elements whose content is never shown to a reader.
        /// </summary>
        private static readonly HashSet<Type> Hidden =
        [
            typeof(HtmlElementMetadataHead),
            typeof(HtmlElementMetadataStyle),
            typeof(HtmlElementMetadataTitle),
            typeof(HtmlElementMetadataMeta),
            typeof(HtmlElementMetadataLink),
            typeof(HtmlElementMetadataBase),
            typeof(HtmlElementScriptingScript),
            typeof(HtmlElementScriptingNoscript),
            typeof(HtmlElementScriptingCanvas),
            typeof(HtmlElementFieldButton),
            typeof(HtmlElementFieldSelect),
            typeof(HtmlElementFormTextarea),
            typeof(HtmlElementFormDatalist),
            typeof(HtmlElementEmbeddedIframe),
            typeof(HtmlElementEmbeddedObject),
            typeof(HtmlElementEmbeddedEmbed),
            typeof(HtmlElementMultimediaAudio),
            typeof(HtmlElementMultimediaVideo),
            typeof(HtmlElementMultimediaSvg),
            typeof(HtmlElementMultimediaMath)
        ];

        /// <summary>
        /// Reads an HTML string and converts it into a PDF document.
        /// </summary>
        /// <param name="html">The HTML to convert.</param>
        /// <returns>The PDF document, ready to be configured and saved.</returns>
        public static PdfDocument ConvertHtmlToPdf(string html)
        {
            return string.IsNullOrEmpty(html)
                ? new PdfDocument()
                : new HtmlParser().Parse(html).ConvertToPdf();
        }

        /// <summary>
        /// Converts parsed HTML nodes into a PDF document.
        /// </summary>
        /// <param name="nodes">The nodes as <see cref="HtmlParser"/> returns them.</param>
        /// <returns>The PDF document, ready to be configured and saved.</returns>
        public static PdfDocument ConvertToPdf(this IEnumerable<IHtmlNode> nodes)
        {
            return new PdfDocument().Add(ConvertBlocks(nodes ?? [], new Context()));
        }

        /// <summary>
        /// Converts nodes in inline context, for markup embedded in another format.
        /// </summary>
        /// <param name="nodes">The nodes.</param>
        /// <param name="style">The style of the surrounding text.</param>
        /// <returns>The inline elements.</returns>
        internal static List<PdfInlineElement> ConvertInline(IEnumerable<IHtmlNode> nodes, PdfTextStyle style)
        {
            var result = new List<PdfInlineElement>();

            foreach (var node in nodes ?? [])
            {
                ConvertInline(node, style, result, []);
            }

            // inline content cannot be split around a picture, so it is named instead
            return result
                .Select(x => x is ImagePlaceholder p
                    ? new PdfInlineElementText($"[{(string.IsNullOrWhiteSpace(p.Image.Alt) ? "Image" : WebUtility.HtmlDecode(p.Image.Alt))}]", style with { Italic = true })
                    : x)
                .ToList();
        }

        /// <summary>
        /// Converts a sequence of nodes in block context. Inline content between blocks is
        /// collected into a paragraph, so text a document leaves at the top level is kept.
        /// </summary>
        /// <param name="nodes">The nodes.</param>
        /// <param name="context">The inherited formatting.</param>
        /// <returns>The blocks.</returns>
        private static List<PdfBlockElement> ConvertBlocks(IEnumerable<IHtmlNode> nodes, Context context)
        {
            var blocks = new List<PdfBlockElement>();
            var pending = new List<IHtmlNode>();

            void Flush()
            {
                if (pending.Count > 0)
                {
                    blocks.AddRange(ConvertParagraph(pending, context, null));
                    pending.Clear();
                }
            }

            foreach (var node in nodes)
            {
                if (node is HtmlElement element && IsBlock(element))
                {
                    Flush();
                    blocks.AddRange(ConvertBlock(element, context));
                }
                else
                {
                    pending.Add(node);
                }
            }

            Flush();

            return blocks;
        }

        /// <summary>
        /// Returns whether an element starts a block of its own. An element the parser does
        /// not know is a block when it holds one.
        /// </summary>
        /// <param name="element">The element.</param>
        /// <returns>True for a block.</returns>
        private static bool IsBlock(HtmlElement element)
        {
            return element switch
            {
                HtmlElementSectionH1 or HtmlElementSectionH2 or HtmlElementSectionH3
                    or HtmlElementSectionH4 or HtmlElementSectionH5 or HtmlElementSectionH6 => true,
                HtmlElementTextContentP or HtmlElementTextContentDiv or HtmlElementTextContentPre
                    or HtmlElementTextContentBlockquote or HtmlElementTextContentUl or HtmlElementTextContentOl
                    or HtmlElementTextContentHr or HtmlElementTextContentDl or HtmlElementTextContentDt
                    or HtmlElementTextContentDd or HtmlElementTextContentFigure or HtmlElementTextContentFigcaption
                    or HtmlElementTextContentLi => true,
                HtmlElementTableTable => true,
                HtmlElementSectionBody or HtmlElementSectionArticle or HtmlElementSectionSection
                    or HtmlElementSectionHeader or HtmlElementSectionFooter or HtmlElementSectionMain
                    or HtmlElementSectionAside or HtmlElementSectionNav or HtmlElementSectionAddress
                    or HtmlElementRootHtml => true,
                HtmlElementMultimediaImg image => IsBlockImage(image),
                _ => Hidden.Contains(element.GetType()) || (element.GetType() == typeof(HtmlElement) && element.Elements.OfType<HtmlElement>().Any(IsBlock))
            };
        }

        /// <summary>
        /// Converts a block element.
        /// </summary>
        /// <param name="element">The element.</param>
        /// <param name="context">The inherited formatting.</param>
        /// <returns>The blocks it becomes.</returns>
        private static IEnumerable<PdfBlockElement> ConvertBlock(HtmlElement element, Context context)
        {
            if (Hidden.Contains(element.GetType()))
            {
                return [];
            }

            var css = Css.Parse(element.Style);
            var local = context.Apply(css);

            switch (element)
            {
                case HtmlElementSectionH1:
                    return [Heading(1, element, local, css)];
                case HtmlElementSectionH2:
                    return [Heading(2, element, local, css)];
                case HtmlElementSectionH3:
                    return [Heading(3, element, local, css)];
                case HtmlElementSectionH4:
                    return [Heading(4, element, local, css)];
                case HtmlElementSectionH5:
                    return [Heading(5, element, local, css)];
                case HtmlElementSectionH6:
                    return [Heading(6, element, local, css)];
                case HtmlElementTextContentP:
                    return ConvertParagraph(element.Elements, local, css);
                case HtmlElementTextContentHr:
                    return [new PdfBlockElementRule()];
                case HtmlElementTextContentPre:
                    return [ConvertCode(element)];
                case HtmlElementTextContentBlockquote:
                    return [new PdfBlockElementQuote(ConvertBlocks(element.Elements, local))];
                case HtmlElementTextContentUl:
                    return [ConvertList(element, false, local)];
                case HtmlElementTextContentOl:
                    return [ConvertList(element, true, local)];
                case HtmlElementTextContentLi:
                    return [new PdfBlockElementList().Add(new PdfBlockElementListItem(ConvertBlocks(element.Elements, local)))];
                case HtmlElementTableTable table:
                    return [ConvertTable(table, local)];
                case HtmlElementMultimediaImg image:
                    return [ConvertImage(image, css, local)];
                case HtmlElementTextContentDt:
                    return ConvertParagraph(element.Elements, local with { Style = local.Style with { Bold = true } }, css);
                case HtmlElementTextContentDd:
                    return Indent(ConvertBlocks(element.Elements, local), 21f);
                case HtmlElementTextContentFigcaption:
                    return ConvertParagraph(element.Elements, local with { Style = local.Style with { Italic = true }, Align = local.Align ?? PdfTextAlign.Center }, css);
                case HtmlElementTextContentDiv:
                    return ConvertDiv(element, local, css);
                default:
                    return ConvertBlocks(element.Elements, local);
            }
        }

        /// <summary>
        /// Converts a division, which is how the editor and the markdown renderer write the
        /// structures that have no element of their own: the regions of a row, callouts,
        /// plugins and the alerts of an add-on.
        /// </summary>
        /// <param name="element">The element.</param>
        /// <param name="context">The formatting, including the element's own style.</param>
        /// <param name="css">The element's own declarations.</param>
        /// <returns>The blocks.</returns>
        private static IEnumerable<PdfBlockElement> ConvertDiv(HtmlElement element, Context context, Css css)
        {
            var classes = Classes(element);

            if (classes.Contains("wx-editor-row"))
            {
                return [ConvertRow(element, context)];
            }

            if (PluginName(element, classes) is string name)
            {
                return classes.Contains("wx-plugin-inline")
                    ? [new PdfBlockElementParagraph([new PdfInlineElementPlugin(name, PluginParameters(element), context.Style)]) { Align = css.Align ?? context.Align }]
                    : [new PdfBlockElementPlugin(name, PluginParameters(element), ConvertBlocks(element.Elements, context))];
            }

            var callout = CalloutType(classes);

            if (callout is PdfCalloutType type)
            {
                var body = element.Elements.OfType<HtmlElement>().FirstOrDefault(e => Classes(e).Contains("wx-callout-body"));

                return [new PdfBlockElementCallout(type, ConvertBlocks(body?.Elements ?? element.Elements, context))];
            }

            var blocks = ConvertBlocks(element.Elements, context);

            if (css.Background is PdfColor background && blocks.Count > 0)
            {
                // a shaded division is a box around its content; a callout without an accent
                // would claim a meaning the author did not give it, so a one-cell table is used
                return [new PdfBlockElementTable { Bordered = false }
                    .Add(new PdfBlockElementTableRow([new PdfBlockElementTableCell(blocks) { Background = background }]))];
            }

            return Indent(blocks, css.MarginLeft);
        }

        /// <summary>
        /// Returns the name of the plugin a division stands for, as
        /// <see cref="WebMarkdown.MarkdownRendererHtml"/> writes it.
        /// </summary>
        /// <param name="element">The division.</param>
        /// <param name="classes">Its classes.</param>
        /// <returns>The name, or null when the division is no plugin.</returns>
        private static string PluginName(HtmlElement element, HashSet<string> classes)
        {
            return classes.Contains("wx-plugin") && element.GetUserAttribute("data-plugin") is { Length: > 0 } name
                ? WebUtility.HtmlDecode(name)
                : null;
        }

        /// <summary>
        /// Returns the parameters of a plugin division, which the markdown renderer writes as
        /// one <c>data-plugin-*</c> attribute each.
        /// </summary>
        /// <param name="element">The division.</param>
        /// <returns>The parameters by name.</returns>
        private static Dictionary<string, string> PluginParameters(HtmlElement element)
        {
            const string prefix = "data-plugin-";

            return element.Attributes
                .OfType<HtmlAttribute>()
                .Where(x => x.Name?.Length > prefix.Length && x.Name.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                .GroupBy(x => x.Name[prefix.Length..], StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => WebUtility.HtmlDecode(g.First().Value ?? ""), StringComparer.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Returns the kind of callout a set of classes names, from the markdown renderer
        /// (<c>wx-callout-*</c>) or from an alert (<c>alert-*</c>).
        /// </summary>
        /// <param name="classes">The classes.</param>
        /// <returns>The kind, or null when the classes name none.</returns>
        private static PdfCalloutType? CalloutType(HashSet<string> classes)
        {
            if (!classes.Contains("wx-callout") && !classes.Contains("alert"))
            {
                return null;
            }

            if (classes.Contains("wx-callout-warning") || classes.Contains("alert-warning"))
            {
                return PdfCalloutType.Warning;
            }

            if (classes.Contains("wx-callout-danger") || classes.Contains("alert-danger"))
            {
                return PdfCalloutType.Danger;
            }

            if (classes.Contains("wx-callout-success") || classes.Contains("alert-success"))
            {
                return PdfCalloutType.Success;
            }

            return PdfCalloutType.Hint;
        }

        /// <summary>
        /// Converts a row of the editor into columns. A region carries its share of the row
        /// as its weight, which becomes the relative width of its column.
        /// </summary>
        /// <param name="element">The row.</param>
        /// <param name="context">The inherited formatting.</param>
        /// <returns>The column layout.</returns>
        private static PdfBlockElement ConvertRow(HtmlElement element, Context context)
        {
            var regions = element.Elements.OfType<HtmlElement>().Where(e => Classes(e).Contains("wx-editor-region")).ToList();
            var cells = regions.Select(r => new PdfBlockElementTableCell(ConvertBlocks(r.Elements, context.Apply(Css.Parse(r.Style)))));
            var weights = regions.Select(r => float.TryParse(r.GetUserAttribute("data-weight"), NumberStyles.Float, CultureInfo.InvariantCulture, out var w) && w > 0 ? w : 1f);

            return new PdfBlockElementTable { Bordered = false }
                .SetColumnWidths(weights)
                .Add(new PdfBlockElementTableRow(cells));
        }

        /// <summary>
        /// Converts a heading.
        /// </summary>
        private static PdfBlockElement Heading(int level, HtmlElement element, Context context, Css css)
        {
            return new PdfBlockElementHeading(level, Trim(ConvertInline(element.Elements, context.Style)))
            {
                Align = css.Align ?? context.Align
            };
        }

        /// <summary>
        /// Converts the content of a paragraph. A picture is a block in the PDF model, so a
        /// paragraph that holds one is split around it.
        /// </summary>
        /// <param name="nodes">The content.</param>
        /// <param name="context">The formatting, including the paragraph's own style.</param>
        /// <param name="css">The paragraph's own declarations, or null for loose content.</param>
        /// <returns>The blocks.</returns>
        private static IEnumerable<PdfBlockElement> ConvertParagraph(IEnumerable<IHtmlNode> nodes, Context context, Css css)
        {
            var blocks = new List<PdfBlockElement>();
            var inline = new List<PdfInlineElement>();
            var images = new List<HtmlElementMultimediaImg>();

            void Flush()
            {
                if (inline.Any(x => x is not PdfInlineElementText text || !string.IsNullOrWhiteSpace(text.Text)))
                {
                    blocks.Add(new PdfBlockElementParagraph(Trim(inline))
                    {
                        Align = css?.Align ?? context.Align,
                        Indent = css?.MarginLeft ?? 0,
                        Background = css?.Background
                    });
                }

                inline.Clear();
            }

            foreach (var node in nodes)
            {
                images.Clear();
                ConvertInline(node, context.Style, inline, images);

                foreach (var image in images)
                {
                    // the inline elements before the picture were collected up to it; the
                    // marker tells where the picture interrupts the text
                    var index = inline.FindIndex(x => x is ImagePlaceholder p && p.Image == image);
                    var before = inline.Take(index).ToList();
                    var after = inline.Skip(index + 1).ToList();

                    inline.Clear();
                    inline.AddRange(before);
                    Flush();
                    blocks.Add(ConvertImage(image, Css.Parse(image.Style), context));
                    inline.AddRange(after);
                }
            }

            Flush();

            return blocks;
        }

        /// <summary>
        /// Removes the whitespace a source formatter leaves at the start and end of a
        /// paragraph, which a browser does not show either.
        /// </summary>
        /// <param name="inline">The inline elements.</param>
        /// <returns>The trimmed elements.</returns>
        internal static List<PdfInlineElement> Trim(IEnumerable<PdfInlineElement> inline)
        {
            var result = inline.ToList();

            while (result.Count > 0 && result[0] is PdfInlineElementText first && string.IsNullOrWhiteSpace(first.Text))
            {
                result.RemoveAt(0);
            }

            while (result.Count > 0 && result[^1] is PdfInlineElementText last && string.IsNullOrWhiteSpace(last.Text))
            {
                result.RemoveAt(result.Count - 1);
            }

            if (result.Count > 0 && result[0] is PdfInlineElementText head)
            {
                result[0] = new PdfInlineElementText(head.Text.TrimStart(), head.Style);
            }

            if (result.Count > 0 && result[^1] is PdfInlineElementText tail)
            {
                result[^1] = new PdfInlineElementText(tail.Text.TrimEnd(), tail.Style);
            }

            return result;
        }

        /// <summary>
        /// Converts a node in inline context, carrying the style of its ancestors.
        /// </summary>
        /// <param name="node">The node.</param>
        /// <param name="style">The inherited style.</param>
        /// <param name="result">Collects the inline elements.</param>
        /// <param name="images">Collects pictures met on the way, which are left as placeholders.</param>
        private static void ConvertInline(IHtmlNode node, PdfTextStyle style, List<PdfInlineElement> result, List<HtmlElementMultimediaImg> images)
        {
            switch (node)
            {
                case HtmlText text:
                    result.Add(new PdfInlineElementText(WebUtility.HtmlDecode(text.Value ?? ""), style));
                    return;
                case HtmlElementTextSemanticsBr:
                    result.Add(new PdfInlineElementLineBreak());
                    return;
                case HtmlElementMultimediaImg image:
                    images.Add(image);
                    result.Add(new ImagePlaceholder(image));
                    return;
                case HtmlElementFieldInput input:
                    if (string.Equals(input.Type, "checkbox", StringComparison.OrdinalIgnoreCase))
                    {
                        result.Add(new PdfInlineElementCheckbox(input.Checked || input.HasUserAttribute("checked"), style));
                    }
                    return;
                case HtmlElement element when Hidden.Contains(element.GetType()):
                    return;
                case HtmlElementTextContentDiv division when PluginName(division, Classes(division)) is string name:
                    result.Add(new PdfInlineElementPlugin(name, PluginParameters(division), style));
                    return;
                case HtmlElement element:
                    var inner = Css.Parse(element.Style).ApplyTo(Semantics(element, style));

                    foreach (var child in element.Elements)
                    {
                        ConvertInline(child, inner, result, images);
                    }

                    if (element is HtmlElementTextContentP or HtmlElementTextContentDiv or HtmlElementTextContentLi
                        && result.Count > 0 && result[^1] is not PdfInlineElementLineBreak)
                    {
                        // a block inside inline content - a paragraph in a table cell that is
                        // read inline - still ends its line
                        result.Add(new PdfInlineElementLineBreak());
                    }

                    return;
            }
        }

        /// <summary>
        /// Returns the style an element implies by its meaning.
        /// </summary>
        /// <param name="element">The element.</param>
        /// <param name="style">The inherited style.</param>
        /// <returns>The style of the content.</returns>
        private static PdfTextStyle Semantics(HtmlElement element, PdfTextStyle style)
        {
            return element switch
            {
                HtmlElementTextSemanticsStrong or HtmlElementTextSemanticsB => style with { Bold = true },
                HtmlElementTextSemanticsEm or HtmlElementTextSemanticsI or HtmlElementTextSemanticsCite
                    or HtmlElementTextSemanticsDfn or HtmlElementTextSemanticsVar => style with { Italic = true },
                HtmlElementTextSemanticsU or HtmlElementEditIns => style with { Underline = true },
                HtmlElementTextSemanticsS or HtmlElementEditDel => style with { Strikethrough = true },
                HtmlElementTextSemanticsMark => style with { Background = MarkColor },
                HtmlElementTextSemanticsCode or HtmlElementTextSemanticsKbd or HtmlElementTextSemanticsSamp
                    => style with { FontFamily = PdfFontFamily.Courier, Scale = style.Scale * 0.9f, Background = CodeColor },
                HtmlElementTextSemanticsSup => style with { Superscript = true },
                HtmlElementTextSemanticsSub => style with { Subscript = true },
                HtmlElementTextSemanticsSmall => style with { Scale = style.Scale * 0.85f },
                HtmlElementTextSemanticsA link => style with { Link = WebUtility.HtmlDecode(link.Href ?? ""), Underline = true },
                _ => style
            };
        }

        /// <summary>
        /// Converts a preformatted block. Its text is taken verbatim, including the line
        /// breaks a highlighter may have split into elements.
        /// </summary>
        /// <param name="element">The element.</param>
        /// <returns>The code block.</returns>
        private static PdfBlockElement ConvertCode(HtmlElement element)
        {
            var code = element.Elements.OfType<HtmlElementTextSemanticsCode>().FirstOrDefault();
            var language = (element.GetUserAttribute("data-language") is { Length: > 0 } attribute ? attribute : null)
                ?? (code?.Class ?? element.Class ?? "")
                    .Split(' ')
                    .FirstOrDefault(x => x.StartsWith("language-"))?
                    ["language-".Length..];

            return new PdfBlockElementCode(PlainText(element).Trim('\r', '\n'), language);
        }

        /// <summary>
        /// Converts a list. A nested list is a child of its item, which is where it stays.
        /// </summary>
        /// <param name="element">The list.</param>
        /// <param name="ordered">Whether the list is numbered.</param>
        /// <param name="context">The inherited formatting.</param>
        /// <returns>The list block.</returns>
        private static PdfBlockElement ConvertList(HtmlElement element, bool ordered, Context context)
        {
            var list = new PdfBlockElementList(!ordered
                ? PdfListType.Bullet
                : element.GetUserAttribute("type") switch
                {
                    "a" => PdfListType.LowerAlpha,
                    "A" => PdfListType.UpperAlpha,
                    "i" => PdfListType.LowerRoman,
                    "I" => PdfListType.UpperRoman,
                    _ => PdfListType.Numeric
                });

            if (Css.Parse(element.Style).ListStyleNone)
            {
                list.Type = PdfListType.None;
            }

            if (int.TryParse(element.GetUserAttribute("start"), NumberStyles.Integer, CultureInfo.InvariantCulture, out var start))
            {
                list.Start = start;
            }

            foreach (var child in element.Elements)
            {
                if (child is HtmlElementTextContentLi item)
                {
                    var css = Css.Parse(item.Style);
                    list.Add(new PdfBlockElementListItem(ConvertBlocks(item.Elements, context.Apply(css))));
                }
                else if (child is HtmlElementTextContentUl or HtmlElementTextContentOl)
                {
                    // a list placed directly in a list instead of inside an item, as some
                    // editors write it, continues the item before it
                    var nested = ConvertList((HtmlElement)child, child is HtmlElementTextContentOl, context);
                    var last = list.Items.LastOrDefault();

                    if (last is null)
                    {
                        list.Add(new PdfBlockElementListItem([nested]));
                    }
                    else
                    {
                        last.Add(nested);
                    }
                }
            }

            return list;
        }

        /// <summary>
        /// Converts a table, reading the rows of its head, bodies and foot in document order.
        /// A row of header cells is a header row; a column group with widths fixes the
        /// proportions of the columns, as the editor stores them after a resize.
        /// </summary>
        /// <param name="element">The table.</param>
        /// <param name="context">The inherited formatting.</param>
        /// <returns>The table block.</returns>
        private static PdfBlockElement ConvertTable(HtmlElementTableTable element, Context context)
        {
            var table = new PdfBlockElementTable
            {
                Striped = Classes(element).Contains("table-striped"),
                Bordered = true
            };
            var widths = new List<float>();

            foreach (var child in ((HtmlElement)element).Elements.OfType<HtmlElement>())
            {
                switch (child)
                {
                    case HtmlElementTableColgroup group:
                        widths.AddRange(group.Elements.OfType<HtmlElementTableCol>().Select(c => Css.Parse(c.Style).Width ?? 0));
                        break;
                    case HtmlElementTableThead head:
                        table.Add(Rows(head, context, true));
                        break;
                    case HtmlElementTableTbody or HtmlElementTableTfoot:
                        table.Add(Rows(child, context, false));
                        break;
                    case HtmlElementTableTr row:
                        table.Add(ConvertRow(row, context, false));
                        break;
                }
            }

            if (widths.Any(w => w > 0))
            {
                table.SetColumnWidths(widths);
            }

            return table;
        }

        /// <summary>
        /// Converts the rows of a table section.
        /// </summary>
        private static IEnumerable<PdfBlockElementTableRow> Rows(HtmlElement section, Context context, bool header)
        {
            return section.Elements.OfType<HtmlElementTableTr>().Select(r => ConvertRow(r, context, header));
        }

        /// <summary>
        /// Converts a table row.
        /// </summary>
        private static PdfBlockElementTableRow ConvertRow(HtmlElementTableTr row, Context context, bool header)
        {
            var cells = row.Elements.OfType<HtmlElement>().Where(c => c is HtmlElementTableTd or HtmlElementTableTh).ToList();
            var rowCss = Css.Parse(row.Style);
            var rowContext = context.Apply(rowCss);
            var result = new PdfBlockElementTableRow
            {
                Header = header || (cells.Count > 0 && cells.All(c => c is HtmlElementTableTh)),
                Background = rowCss.Background
            };

            foreach (var cell in cells)
            {
                var css = Css.Parse(cell.Style);

                result.Add(new PdfBlockElementTableCell(ConvertBlocks(cell.Elements, rowContext.Apply(css)))
                {
                    Align = css.Align ?? rowContext.Align,
                    Background = css.Background,
                    ColSpan = int.TryParse(cell.GetUserAttribute("colspan"), out var span) ? span : 1
                });
            }

            return result;
        }

        /// <summary>
        /// Converts a picture. Its size comes from the style the editor writes when the
        /// author resizes it, or from the attributes; its position from the automatic
        /// margins the editor uses to center or right-align it.
        /// </summary>
        /// <param name="image">The element.</param>
        /// <param name="css">Its declarations.</param>
        /// <param name="context">The inherited formatting.</param>
        /// <returns>The picture block.</returns>
        private static PdfBlockElementImage ConvertImage(HtmlElementMultimediaImg image, Css css, Context context)
        {
            return new PdfBlockElementImage(WebUtility.HtmlDecode(image.Src ?? ""), WebUtility.HtmlDecode(image.Alt ?? ""))
            {
                Width = css.Width ?? (image.Width > 0 ? image.Width * 0.75f : null),
                Height = css.Height ?? (image.Height > 0 ? image.Height * 0.75f : null),
                Align = css.ImageAlign ?? context.Align
            };
        }

        /// <summary>
        /// Returns whether a picture stands on its own line, which the editor expresses with
        /// <c>display: block</c>.
        /// </summary>
        private static bool IsBlockImage(HtmlElementMultimediaImg image)
        {
            return Css.Parse(image.Style).Display == "block";
        }

        /// <summary>
        /// Indents the paragraphs among blocks.
        /// </summary>
        private static List<PdfBlockElement> Indent(List<PdfBlockElement> blocks, float indent)
        {
            if (indent > 0)
            {
                foreach (var paragraph in blocks.OfType<PdfBlockElementParagraph>())
                {
                    paragraph.Indent += indent;
                }
            }

            return blocks;
        }

        /// <summary>
        /// Returns the classes of an element.
        /// </summary>
        private static HashSet<string> Classes(HtmlElement element)
        {
            return (element.Class ?? "").Split(' ', StringSplitOptions.RemoveEmptyEntries).ToHashSet();
        }

        /// <summary>
        /// Returns the decoded text of a node and its descendants.
        /// </summary>
        private static string PlainText(IHtmlNode node)
        {
            return node switch
            {
                HtmlText text => WebUtility.HtmlDecode(text.Value ?? ""),
                HtmlElementTextSemanticsBr => "\n",
                HtmlElement element => string.Concat(element.Elements.Select(PlainText)),
                _ => ""
            };
        }

        /// <summary>
        /// Marks the position of a picture among inline elements until the paragraph is
        /// split around it.
        /// </summary>
        private sealed class ImagePlaceholder(HtmlElementMultimediaImg image) : PdfInlineElement
        {
            public HtmlElementMultimediaImg Image { get; } = image;
        }

        /// <summary>
        /// Holds the formatting a block passes on to its content.
        /// </summary>
        private sealed record Context
        {
            public PdfTextStyle Style { get; init; } = PdfTextStyle.Default;
            public PdfTextAlign? Align { get; init; }

            /// <summary>
            /// Returns the context with an element's declarations applied.
            /// </summary>
            public Context Apply(Css css)
            {
                return this with { Style = css.ApplyTo(Style), Align = css.Align ?? Align };
            }
        }

        /// <summary>
        /// Holds the declarations of a <c>style</c> attribute that have an equivalent in the
        /// PDF model.
        /// </summary>
        private sealed class Css
        {
            private readonly Dictionary<string, string> _declarations;

            private Css(Dictionary<string, string> declarations)
            {
                _declarations = declarations;
            }

            public PdfColor? Color => PdfColor.TryParse(Get("color"), out var c) ? c : null;
            public PdfColor? Background => PdfColor.TryParse(Get("background-color") ?? Get("background"), out var c) ? c : null;
            public float? Width => Length(Get("width"));
            public float? Height => Length(Get("height"));
            public float MarginLeft => Length(Get("margin-left")) ?? Length(Get("padding-left")) ?? 0;
            public string Display => Get("display")?.ToLowerInvariant();
            public bool ListStyleNone => Get("list-style-type") == "none" || Get("list-style") == "none";

            public PdfTextAlign? Align => Get("text-align")?.ToLowerInvariant() switch
            {
                "left" or "start" => PdfTextAlign.Left,
                "center" => PdfTextAlign.Center,
                "right" or "end" => PdfTextAlign.Right,
                "justify" => PdfTextAlign.Justify,
                _ => null
            };

            /// <summary>
            /// Returns the position of a picture that is centered or right-aligned by
            /// automatic margins.
            /// </summary>
            public PdfTextAlign? ImageAlign
            {
                get
                {
                    var left = Get("margin-left") == "auto";
                    var right = Get("margin-right") == "auto";

                    return left && right ? PdfTextAlign.Center : left ? PdfTextAlign.Right : right ? PdfTextAlign.Left : null;
                }
            }

            /// <summary>
            /// Reads a style attribute.
            /// </summary>
            public static Css Parse(string style)
            {
                var declarations = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

                foreach (var declaration in WebUtility.HtmlDecode(style ?? "").Split(';'))
                {
                    var colon = declaration.IndexOf(':');

                    if (colon > 0)
                    {
                        declarations[declaration[..colon].Trim()] = declaration[(colon + 1)..].Replace("!important", "").Trim();
                    }
                }

                return new Css(declarations);
            }

            /// <summary>
            /// Returns the text style with the declarations applied.
            /// </summary>
            public PdfTextStyle ApplyTo(PdfTextStyle style)
            {
                if (_declarations.Count == 0)
                {
                    return style;
                }

                var weight = Get("font-weight")?.ToLowerInvariant();
                var decoration = (Get("text-decoration") ?? Get("text-decoration-line") ?? "").ToLowerInvariant();
                var vertical = Get("vertical-align")?.ToLowerInvariant();
                var family = Get("font-family")?.ToLowerInvariant();

                return style with
                {
                    Bold = weight switch
                    {
                        "bold" or "bolder" => true,
                        "normal" or "lighter" => false,
                        _ when int.TryParse(weight, out var w) => w >= 600,
                        _ => style.Bold
                    },
                    Italic = Get("font-style")?.ToLowerInvariant() switch
                    {
                        "italic" or "oblique" => true,
                        "normal" => false,
                        _ => style.Italic
                    },
                    Underline = style.Underline || decoration.Contains("underline"),
                    Strikethrough = style.Strikethrough || decoration.Contains("line-through"),
                    Superscript = style.Superscript || vertical == "super",
                    Subscript = style.Subscript || vertical == "sub",
                    FontFamily = family switch
                    {
                        null => style.FontFamily,
                        _ when family.Contains("mono") || family.Contains("courier") || family.Contains("consolas") => PdfFontFamily.Courier,
                        _ when family.Contains("sans") || family.Contains("arial") || family.Contains("helvetica") => PdfFontFamily.Helvetica,
                        _ when family.Contains("serif") || family.Contains("times") || family.Contains("georgia") => PdfFontFamily.Times,
                        _ => style.FontFamily
                    },
                    Scale = FontScale(Get("font-size"), style.Scale),
                    Color = Color ?? style.Color,
                    Background = Background ?? style.Background
                };
            }

            /// <summary>
            /// Reads a font size as a factor of the body text. Absolute sizes are read
            /// against the 16 pixels a browser sets body text in, so the proportions the
            /// author saw are kept even though the PDF body text is smaller.
            /// </summary>
            private static float FontScale(string value, float inherited)
            {
                if (string.IsNullOrWhiteSpace(value))
                {
                    return inherited;
                }

                value = value.Trim().ToLowerInvariant();

                var keyword = value switch
                {
                    "xx-small" => 0.6f,
                    "x-small" => 0.75f,
                    "small" => 0.89f,
                    "medium" => 1f,
                    "large" => 1.2f,
                    "x-large" => 1.5f,
                    "xx-large" => 2f,
                    "smaller" => inherited * 0.83f,
                    "larger" => inherited * 1.2f,
                    _ => 0f
                };

                if (keyword > 0)
                {
                    return keyword;
                }

                if (Number(value, "em", out var em) || Number(value, "rem", out em))
                {
                    return value.EndsWith("rem") ? em : inherited * em;
                }

                if (Number(value, "%", out var percent))
                {
                    return inherited * percent / 100f;
                }

                if (Number(value, "px", out var px))
                {
                    return px / 16f;
                }

                if (Number(value, "pt", out var pt))
                {
                    return pt / 12f;
                }

                return inherited;
            }

            /// <summary>
            /// Reads a length in points; pixels are converted at 96 dpi. Relative lengths are
            /// not understood and yield null.
            /// </summary>
            private static float? Length(string value)
            {
                if (string.IsNullOrWhiteSpace(value))
                {
                    return null;
                }

                value = value.Trim().ToLowerInvariant();

                if (Number(value, "px", out var px))
                {
                    return px * 0.75f;
                }

                if (Number(value, "pt", out var pt))
                {
                    return pt;
                }

                if (Number(value, "mm", out var mm))
                {
                    return PdfPageSize.FromMillimeters(mm);
                }

                if (Number(value, "cm", out var cm))
                {
                    return PdfPageSize.FromMillimeters(cm * 10);
                }

                if (Number(value, "in", out var inch))
                {
                    return inch * 72f;
                }

                return float.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var plain) ? plain * 0.75f : null;
            }

            /// <summary>
            /// Reads a number with a unit.
            /// </summary>
            private static bool Number(string value, string unit, out float number)
            {
                number = 0;

                return value.EndsWith(unit, StringComparison.Ordinal)
                    && float.TryParse(value[..^unit.Length], NumberStyles.Float, CultureInfo.InvariantCulture, out number)
                    && number >= 0;
            }

            /// <summary>
            /// Returns the value of a declaration, or null.
            /// </summary>
            private string Get(string name)
            {
                return _declarations.TryGetValue(name, out var value) && value.Length > 0 ? value : null;
            }
        }
    }
}
