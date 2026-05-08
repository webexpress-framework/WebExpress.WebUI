using System;
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
        /// Gets or sets the header text.
        /// </summary>
        public Func<IRenderControlContext, string> Header { get; set; }

        /// <summary>
        /// Gets or sets the header image.
        /// </summary>
        public Func<IRenderControlContext, IUri> HeaderImage { get; set; }

        /// <summary>
        /// Gets or sets the headline.
        /// </summary>
        public Func<IRenderControlContext, string> Headline { get; set; }

        /// <summary>
        /// Gets or sets the footer.
        /// </summary>
        public Func<IRenderControlContext, string> Footer { get; set; }

        /// <summary>
        /// Gets or sets the footer image.
        /// </summary>
        public Func<IRenderControlContext, IUri> FooterImage { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="controls">The child controls to be added to the panel card.</param>
        public ControlPanelCard(string id = null, params IControl[] controls)
            : base(id, controls)
        {
            Border = _ => new PropertyBorder(true);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var role = Role?.Invoke(renderContext);
            var theme = Theme?.Invoke(renderContext) ?? TypeTheme.None;
            var header = Header?.Invoke(renderContext);
            var headerImage = HeaderImage?.Invoke(renderContext);
            var headline = Headline?.Invoke(renderContext);
            var footer = Footer?.Invoke(renderContext);
            var footerImage = FooterImage?.Invoke(renderContext);

            var content = Content;
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("card", GetClasses()),
                Style = GetStyles(),
                Role = role,
                DataTheme = theme.ToValue()
            };

            if (!string.IsNullOrWhiteSpace(header))
            {
                html.Add(new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(header))) { Class = "card-header" });
            }

            if (headerImage is not null)
            {
                html.Add(new HtmlElementMultimediaImg()
                {
                    Src = headerImage?.ToString(),
                    Class = "card-img-top"
                });
            }

            if (!string.IsNullOrWhiteSpace(headline))
            {
                var headContent = (IEnumerable<IControl>)[new ControlText()
                {
                    Text = _ => I18N.Translate(headline),
                    Classes = new List<string>(["card-title"]),
                    Format = _ => TypeFormatText.H4
                }];

                content = headContent.Concat(Content);
            }

            html.Add(new HtmlElementTextContentDiv(new HtmlElementTextContentDiv([.. content.Select(x => x?.Render(renderContext, visualTree))])
            {
                Class = "card-text"
            })
            {
                Class = "card-body"
            });

            if (footerImage is not null)
            {
                html.Add(new HtmlElementMultimediaImg()
                {
                    Src = footerImage?.ToString(),
                    Class = "card-img-top"
                });
            }

            if (!string.IsNullOrWhiteSpace(footer))
            {
                html.Add(new HtmlElementTextContentDiv(new HtmlText(footer)) { Class = "card-footer" });
            }

            return html;
        }
    }
}
