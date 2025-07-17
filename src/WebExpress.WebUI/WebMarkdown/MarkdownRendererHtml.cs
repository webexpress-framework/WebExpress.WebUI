using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebMarkdown.Element;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebMarkdown
{
    /// <summary>
    /// Converts the specified <see cref="MarkdownDocument"/> to an HTML element.
    /// </summary>
    public static class MarkdownRendererHtml
    {
        /// <summary>
        /// Converts the specified <see cref="MarkdownDocument"/> to an HTML element.
        /// </summary>
        /// <param name="document">The document to convert. Cannot be null.</param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>An <see cref="IHtmlNode"/> representing the HTML structure of the markdown content.</returns>
        public static IHtmlNode ConvertToHtml(this MarkdownDocument document, IRenderControlContext renderContext)
        {
            return ConvertElement(document?.Elements ?? [], renderContext);
        }

        /// <summary>
        /// Converts a markdown element into its corresponding HTML node representation.
        /// </summary>
        /// <param name="element">
        /// The markdown element to convert. Must be a recognized type of markdown element.
        /// </param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>
        /// An <see cref="IHtmlNode"/> representing the HTML equivalent of the provided markdown 
        /// element. Returns null if the element type is not supported.
        /// </returns>
        private static IHtmlNode ConvertElement(IEnumerable<IMarkdownElement> elements, IRenderControlContext renderContext)
        {
            var list = new HtmlList();

            foreach (var element in elements)
            {
                if (element is MarkdownBlockElementHeader header)
                {
                    list.Add(header.Level switch
                    {
                        1 => new HtmlElementSectionH1(ConvertElement(header.Content, renderContext)),
                        2 => new HtmlElementSectionH2(ConvertElement(header.Content, renderContext)),
                        3 => new HtmlElementSectionH3(ConvertElement(header.Content, renderContext)),
                        4 => new HtmlElementSectionH4(ConvertElement(header.Content, renderContext)),
                        5 => new HtmlElementSectionH5(ConvertElement(header.Content, renderContext)),
                        6 => new HtmlElementSectionH6(ConvertElement(header.Content, renderContext)),
                        _ => new HtmlElementSectionH6(ConvertElement(header.Content, renderContext))
                    });
                }
                else if (element is MarkdownBlockElementHorizontalRule horizontalRule)
                {
                    list.Add(new HtmlElementTextContentHr());
                }
                else if (element is MarkdownBlockElementIndent indent)
                {
                    list.Add(new HtmlElementTextContentDiv(ConvertElement(indent.Content, renderContext))
                    {
                        Style = "text-indent: 2em;"
                    });
                }
                else if (element is MarkdownBlockElementCode code)
                {
                    list.Add(new HtmlElementTextContentPre(new HtmlText(code.Content))
                    {
                        Class = "wx-webui-code"
                    }
                        .AddUserAttribute("data-line-numbers", "true")
                        .AddUserAttribute("data-language", code.Language));
                }
                else if (element is MarkdownBlockElementQuote quote)
                {
                    list.Add(new HtmlElementTextContentBlockquote(ConvertElement(quote.Content, renderContext)));
                }
                else if (element is MarkdownBlockElementCallout callout)
                {
                    switch (callout.CalloutType)
                    {
                        case MarkdownCalloutType.Hint:
                            {
                                list.Add(new HtmlElementTextContentDiv()
                                {
                                    Class = "wx-callout wx-callout-primary",
                                }
                                .Add(new HtmlElementTextContentDiv(ConvertElement(callout.Content, renderContext))
                                {
                                    Class = "wx-callout-body",
                                }));
                                break;
                            }
                        case MarkdownCalloutType.Warning:
                            {
                                list.Add(new HtmlElementTextContentDiv()
                                {
                                    Class = "wx-callout wx-callout-warning",
                                }
                                .Add(new HtmlElementTextContentDiv(ConvertElement(callout.Content, renderContext))
                                {
                                    Class = "wx-callout-body",
                                }));
                                break;
                            }
                        case MarkdownCalloutType.Danger:
                            {
                                list.Add(new HtmlElementTextContentDiv()
                                {
                                    Class = "wx-callout wx-callout-danger",
                                }
                                .Add(new HtmlElementTextContentDiv(ConvertElement(callout.Content, renderContext))
                                {
                                    Class = "wx-callout-body",
                                }));
                                break;
                            }
                        case MarkdownCalloutType.Success:
                            {
                                list.Add(new HtmlElementTextContentDiv()
                                {
                                    Class = "wx-callout wx-callout-success",
                                }
                                .Add(new HtmlElementTextContentDiv(ConvertElement(callout.Content, renderContext))
                                {
                                    Class = "wx-callout-body",
                                }));
                                break;
                            }
                        default:
                            list.Add(new HtmlElementTextContentDiv(ConvertElement(callout.Content, renderContext)));
                            break;
                    }
                }
                else if (element is MarkdownBlockElementList elementList)
                {
                    if (elementList.Ordered)
                    {
                        var orderedType = elementList.Items.FirstOrDefault()?.OrderedType ?? null;
                        var orderedNumber = elementList.Items.FirstOrDefault()?.OrderedNumber ?? null;

                        list.Add(new HtmlElementTextContentOl
                        (
                            elementList.Items.Select(item =>
                                new HtmlElementTextContentLi
                                (
                                    ConvertElement(item.Content, renderContext)
                                )
                            )
                        )
                            .Add(ConvertElement([elementList.Child], renderContext))
                            .AddUserAttribute
                            (
                                "type",
                                orderedType != MarkdownListType.Numeric
                                    ? orderedType?.ToHtmlType()
                                    : null
                            )
                            .AddUserAttribute
                            (
                                "start",
                                orderedNumber.HasValue
                                    ? (orderedNumber.Value == 1 ? null : orderedNumber.Value.ToString())
                                    : null
                            ));
                    }
                    else
                    {
                        list.Add(new HtmlElementTextContentUl
                        (
                            elementList.Items.Select(item =>
                                new HtmlElementTextContentLi
                                (
                                    ConvertElement(item.Content, renderContext)
                                )
                            )
                        ).Add(ConvertElement([elementList.Child], renderContext)));
                    }
                }
                else if (element is MarkdownBlockElementTable table)
                {
                    var tab = new ControlTable()
                        .AddColumns(table.Columns.Select(x => new ControlTableColumn() { Title = x.PlainText }))
                        .AddRows(table.Rows.Select(row => new ControlTableRow()
                            .Add(row.Select(cell => new ControlTableCell() { Text = cell.PlainText }))));

                    list.Add(tab.Render(renderContext, null));
                }
                else if (element is MarkdownBlockElementParagraph paragraph)
                {
                    list.Add(new HtmlElementTextContentP(ConvertElement(paragraph.Content, renderContext)));
                }
                else if (element is MarkdownInlineElementItalic italic)
                {
                    list.Add(new HtmlElementTextSemanticsI(ConvertElement(italic.Content, renderContext)));
                }
                else if (element is MarkdownInlineElementBold bold)
                {
                    list.Add(new HtmlElementTextSemanticsStrong(ConvertElement(bold.Content, renderContext)));
                }
                else if (element is MarkdownInlineElementUnderline underline)
                {
                    list.Add(new HtmlElementTextSemanticsU(ConvertElement(underline.Content, renderContext)));
                }
                else if (element is MarkdownInlineElementStrikethrough strikethrough)
                {
                    list.Add(new HtmlElementTextSemanticsS(ConvertElement(strikethrough.Content, renderContext)));
                }
                else if (element is MarkdownInlineElementMarked marked)
                {
                    list.Add(new HtmlElementTextSemanticsMark(ConvertElement(marked.Content, renderContext)));
                }
                else if (element is MarkdownInlineElementCode inlineCode)
                {
                    list.Add(new HtmlElementTextSemanticsCode(new HtmlText(inlineCode.Code)));
                }
                else if (element is MarkdownInlineElementUrl url)
                {
                    list.Add(new HtmlElementTextSemanticsA(new HtmlText(url.Url)) { Href = url.Url });
                }
                else if (element is MarkdownInlineElementImage img)
                {
                    list.Add(new HtmlElementMultimediaImg() { Src = img.Url, Alt = img.AltText, Style = "max-width: 100%;" });
                }
                else if (element is MarkdownInlineElementLink link)
                {
                    list.Add(new HtmlElementTextSemanticsA(new HtmlText(link.Text)) { Href = link.Url });
                }
                else if (element is MarkdownInlineElementCheckbox checkbox)
                {
                    list.Add(new HtmlElementFieldInput()
                    {
                        Type = "checkbox",
                        Class = "form-check-input",
                        Checked = checkbox.Value == "true" ? true : false
                    });
                }
                else if (element is MarkdownInlineElementFootnote footnote)
                {
                    list.Add(new HtmlElementTextSemanticsSup(new HtmlText(footnote.Id)));
                }
                else if (element is MarkdownInlineElementHtml html)
                {
                    list.Add(new HtmlRaw(html.Html));
                }
                else if (element is MarkdownInlineElementPlainText text)
                {
                    list.Add(new HtmlText(text.Text));
                }
            }

            return list;
        }
    }
}
