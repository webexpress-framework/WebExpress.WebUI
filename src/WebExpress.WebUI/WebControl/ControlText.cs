using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebMarkdown;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a text control with various formatting options.
    /// </summary>
    public class ControlText : Control
    {
        /// <summary>
        /// Returns or sets the text color.
        /// </summary>
        public new virtual PropertyColorText TextColor
        {
            get => (PropertyColorText)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
        }

        /// <summary>
        /// Returns or sets the format of the text.
        /// </summary>
        /// <value>The format of the text.</value>
        /// <remarks>
        /// This property allows you to specify the format of the text, such as paragraph, italic, bold, underline, etc.
        /// </remarks>
        public TypeFormatText Format { get; set; }

        /// <summary>
        /// Returns or sets the size of the text.
        /// </summary>
        public PropertySizeText Size
        {
            get => (PropertySizeText)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
        }

        /// <summary>
        /// Returns or sets the text.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Returns or sets a tooltip text.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlText(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var text = I18N.Translate(renderContext?.Request.Culture, Text);
            var html = default(HtmlElement);

            switch (Format)
            {
                case TypeFormatText.Paragraph:
                    html = new HtmlElementTextContentP(text)
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Italic:
                    html = new HtmlElementTextSemanticsI(text)
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Bold:
                    html = new HtmlElementTextSemanticsB(text)
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Underline:
                    html = new HtmlElementTextSemanticsU(text)
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.StruckOut:
                    html = new HtmlElementTextSemanticsS(text)
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Cite:
                    html = new HtmlElementTextSemanticsCite(text)
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.H1:
                    html = new HtmlElementSectionH1(text)
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.H2:
                    html = new HtmlElementSectionH2(text)
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.H3:
                    html = new HtmlElementSectionH3(text)
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.H4:
                    html = new HtmlElementSectionH4(text)
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.H5:
                    html = new HtmlElementSectionH5(text)
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.H6:
                    html = new HtmlElementSectionH6(text)
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Span:
                    html = new HtmlElementTextSemanticsSpan(new HtmlText(text))
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Small:
                    html = new HtmlElementTextSemanticsSmall(new HtmlText(text))
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Strong:
                    html = new HtmlElementTextSemanticsStrong(new HtmlText(text))
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Center:
                    html = new HtmlElementTextContentDiv(new HtmlText(text))
                    {
                        Id = Id,
                        Class = Css.Concatenate("text-center", GetClasses()),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Code:
                    html = text?.Split('\n').Length > 1
                        ? new HtmlElementTextContentPre(new HtmlText(text))
                        {
                            Id = Id,
                            Class = GetClasses(),
                            Style = GetStyles(),
                            Role = Role
                        }
                        : new HtmlElementTextSemanticsCode(new HtmlText(text))
                        {
                            Id = Id,
                            Class = GetClasses(),
                            Style = GetStyles(),
                            Role = Role
                        };
                    break;
                case TypeFormatText.Output:
                    html = new HtmlElementTextSemanticsSamp(new HtmlText(text))
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Time:
                    html = new HtmlElementTextSemanticsTime(new HtmlText(text))
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Mark:
                    html = new HtmlElementTextSemanticsMark(new HtmlText(text))
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Highlight:
                    html = new HtmlElementTextSemanticsEm(new HtmlText(text))
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Definition:
                    html = new HtmlElementTextSemanticsDfn(new HtmlText(text))
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Abbreviation:
                    html = new HtmlElementTextSemanticsAbbr(new HtmlText(text))
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Input:
                    html = new HtmlElementTextSemanticsKdb(new HtmlText(text))
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Blockquote:
                    html = new HtmlElementTextContentBlockquote(new HtmlText(text))
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Figcaption:
                    html = new HtmlElementTextContentFigcaption(new HtmlText(text))
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Preformatted:
                    html = new HtmlElementTextContentPre(new HtmlText(text))
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
                case TypeFormatText.Markdown:
                    return MarkdownParser.Parse(text).ConvertToHtml(renderContext);
                default:
                    html = new HtmlElementTextContentDiv(new HtmlText(text))
                    {
                        Id = Id,
                        Class = GetClasses(),
                        Style = GetStyles(),
                        Role = Role
                    };
                    break;
            }

            if (!string.IsNullOrWhiteSpace(Title))
            {
                html.AddUserAttribute("data-toggle", "tooltip");
                html.AddUserAttribute("title", Title);
            }

            return html;
        }
    }
}
