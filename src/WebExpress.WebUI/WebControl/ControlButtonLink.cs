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
        /// Gets or sets the target uri.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Gets or sets the tooltip.
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
            var text = Text?.Invoke(renderContext);
            text = I18N.Translate(text);

            var html = new HtmlElementTextSemanticsA()
            {
                Id = Id,
                Class = Css.Concatenate("btn", GetClasses()),
                Style = GetStyles(),
                Role = Role,
                Href = Uri?.BindParameters(renderContext.Request.Parameters).ToString(),
                Title = I18N.Translate(renderContext, Tooltip),
                OnClick = OnClick?.ToString()
            };

            var icon = Icon?.Invoke(renderContext);
            var primaryAction = PrimaryAction?.Invoke(renderContext);
            var secondaryAction = SecondaryAction?.Invoke(renderContext);

            if (icon is not null)
            {
                html.Add(new ControlIcon()
                {
                    Icon = icon,
                    Margin = !string.IsNullOrWhiteSpace(text) ? new PropertySpacingMargin
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

            if (Content.Count() != 0)
            {
                html.Add(Content.Select(x => x.Render(renderContext, visualTree)).ToArray());
            }

            if (!string.IsNullOrWhiteSpace(Tooltip))
            {
                html.AddUserAttribute("data-bs-toggle", "tooltip");
            }

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
