using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a link button control.
    /// </summary>
    public class ControlButtonLink : ControlButton
    {
        /// <summary>
        /// Returns or sets the target uri.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Returns or sets the tooltip.
        /// </summary>
        public string Tooltip { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The child controls to be added to the button.</param>
        public ControlButtonLink(string id = null, params IControl[] content)
            : base(id, content)
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
            var text = I18N.Translate(Text);

            var html = new HtmlElementTextSemanticsA()
            {
                Id = Id,
                Class = Css.Concatenate("btn", GetClasses()),
                Style = GetStyles(),
                Role = Role,
                Href = Uri?.ToString(),
                Title = Tooltip,
                OnClick = OnClick?.ToString()
            };

            if (Icon != null)
            {
                html.Add(new ControlIcon()
                {
                    Icon = Icon,
                    Margin = !string.IsNullOrWhiteSpace(Text) ? new PropertySpacingMargin
                    (
                        PropertySpacing.Space.None,
                        PropertySpacing.Space.Two,
                        PropertySpacing.Space.None,
                        PropertySpacing.Space.None
                    ) : new PropertySpacingMargin(PropertySpacing.Space.None),
                    VerticalAlignment = TypeVerticalAlignment.Default
                }.Render(renderContext, visualTree));
            }

            if (!string.IsNullOrWhiteSpace(text))
            {
                html.Add(new HtmlText(text));
            }

            if (Content.Any())
            {
                html.Add(Content.Select(x => x.Render(renderContext, visualTree)).ToArray());
            }

            if (!string.IsNullOrWhiteSpace(Tooltip))
            {
                html.AddUserAttribute("data-bs-toggle", "tooltip");
            }

            if (!string.IsNullOrWhiteSpace(Modal))
            {
                html.AddUserAttribute("data-wx-toggle", "modal");
                html.AddUserAttribute("data-wx-target", $"#{Modal}");
            }

            return html;
        }
    }
}
