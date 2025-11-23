using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control panel card with a header, footer, and content area.
    /// </summary>
    public class ControlPanelCard : ControlPanel
    {
        /// <summary>
        /// Returns or sets the header text.
        /// </summary>
        public string Header { get; set; }

        /// <summary>
        /// Returns or sets the header image.
        /// </summary>
        public IUri HeaderImage { get; set; }

        /// <summary>
        /// Returns or sets the headline.
        /// </summary>
        public string Headline { get; set; }

        /// <summary>
        /// Returns or sets the footer.
        /// </summary>
        public string Footer { get; set; }

        /// <summary>
        /// Returns or sets the footer image.
        /// </summary>
        public IUri FooterImage { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="controls">The child controls to be added to the panel card.</param>
        public ControlPanelCard(string id = null, params IControl[] controls)
            : base(id, controls)
        {
            Border = new PropertyBorder(true);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var content = Content;
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("card", GetClasses()),
                Style = GetStyles(),
                Role = Role,
                DataTheme = Theme.ToValue()
            };

            if (!string.IsNullOrWhiteSpace(Header))
            {
                html.Add(new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(Header))) { Class = "card-header" });
            }

            if (HeaderImage is not null)
            {
                html.Add(new HtmlElementMultimediaImg()
                {
                    Src = HeaderImage?.ToString(),
                    Class = "card-img-top"
                });
            }

            if (!string.IsNullOrWhiteSpace(Headline))
            {
                var headContent = (IEnumerable<IControl>)[new ControlText()
                {
                    Text = I18N.Translate(Headline),
                    Classes = new List<string>(["card-title"]),
                    Format = TypeFormatText.H4
                }];

                content = headContent.Concat(Content);
            }

            html.Add(new HtmlElementTextContentDiv(new HtmlElementTextContentDiv([.. content.Select(x => x.Render(renderContext, visualTree))])
            {
                Class = "card-text"
            })
            {
                Class = "card-body"
            });

            if (FooterImage is not null)
            {
                html.Add(new HtmlElementMultimediaImg()
                {
                    Src = FooterImage?.ToString(),
                    Class = "card-img-top"
                });
            }

            if (!string.IsNullOrWhiteSpace(Footer))
            {
                html.Add(new HtmlElementTextContentDiv(new HtmlText(Footer)) { Class = "card-footer" });
            }

            return html;
        }
    }
}
