using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
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
            return Render(renderContext, visualTree, Text, Uri, Tooltip, PrimaryAction, SecondaryAction, Icon, [.. Content]);
        }

        /// <summary>
        /// Renders a button element as an HTML node with optional icon, text, tooltip, modal behavior, 
        /// and additional content.
        /// </summary>
        /// <param name="renderContext">
        /// The rendering context that provides information and services required during control 
        /// rendering.
        /// </param>
        /// <param name="visualTree">
        /// The visual tree context used to resolve control hierarchies and relationships during 
        /// rendering.
        /// </param>
        /// <param name="text">
        /// The text label to display within the button. This value is localized before 
        /// rendering. Can be null or empty.
        /// </param>
        /// <param name="uri">
        /// The URI to navigate to when the button is clicked. Ignored if a modal is specified.
        /// </param>
        /// <param name="tooltip">
        /// The tooltip text to display when the user hovers over the button. This value is 
        /// localized before rendering. Can be null or empty.
        /// </param>
        /// <param name="primaryAction">
        /// The primary action to associate with the button. If specified, this action is 
        /// invoked when the button is  activated. Can be null.
        /// </param>
        /// <param name="secondaryAction">
        /// An optional secondary action to associate with the button. Can be null.
        /// </param>
        /// <param name="icon">
        /// The icon to display within the button. Can be null if no icon is required.
        /// </param>
        /// <param name="content">
        /// Additional controls to render as child content within the button. Can be empty.
        /// </param>
        /// <returns>
        /// An <see cref="IHtmlNode"/> representing the rendered button element, including any 
        /// specified icon, text, tooltip, modal attributes, and child content.
        /// </returns>
        public virtual IHtmlNode Render
        (
            IRenderControlContext renderContext,
            IVisualTreeControl visualTree,
            string text,
            IUri uri,
            string tooltip,
            IAction primaryAction,
            IAction secondaryAction,
            IIcon icon,
            params IControl[] content
        )
        {
            text = I18N.Translate(text);

            var html = new HtmlElementTextSemanticsA()
            {
                Id = Id,
                Class = Css.Concatenate("btn", GetClasses()),
                Style = GetStyles(),
                Role = Role,
                Href = PrimaryAction is null ? uri?.ToString() : null,
                Title = I18N.Translate(renderContext, tooltip),
                OnClick = OnClick?.ToString()
            };

            if (Icon is not null)
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

            if (content.Length != 0)
            {
                html.Add(content.Select(x => x.Render(renderContext, visualTree)).ToArray());
            }

            if (!string.IsNullOrWhiteSpace(tooltip))
            {
                html.AddUserAttribute("data-bs-toggle", "tooltip");
            }

            //if (modal is not null)
            //{
            //    Modal?.ApplyUserAttributes(html);
            //    html.AddUserAttribute("data-wx-uri", uri?.ToString());
            //}

            PrimaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            SecondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
