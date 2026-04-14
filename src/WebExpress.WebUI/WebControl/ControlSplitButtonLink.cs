using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a split button link control that can contain multiple items 
    /// and navigate to a specified URI.
    /// </summary>
    public class ControlSplitButtonLink : ControlSplitButton
    {
        /// <summary>
        /// Gets or sets the target.
        /// </summary>
        public TypeTarget Target { get; set; }

        /// <summary>
        /// Gets or sets the uri.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The content of the html element.</param>
        public ControlSplitButtonLink(string id = null, params IControlSplitButtonItem[] items)
            : base(id, items)
        {
            Size = TypeSizeButton.Default;
            Role = "button";
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            return Render(renderContext, visualTree, Text, Uri, PrimaryAction, SecondaryAction, Icon, [.. Items]);
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
        /// <param name="items"></param>
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
            IAction primaryAction,
            IAction secondaryAction,
            IIcon icon,
            IEnumerable<IControlSplitButtonItem> items
        )
        {
            var button = new HtmlElementTextSemanticsA()
            {
                Id = string.IsNullOrWhiteSpace(Id) ? "" : Id + "_btn",
                Class = Css.Concatenate("btn", Css.Remove(GetClasses(), Margin.ToClass())),
                Style = GetStyles(),
                Target = Target,
                Href = Uri?.ToString(),
                OnClick = OnClick?.ToString()
            };

            if (icon is not null)
            {
                button.Add(new ControlIcon()
                {
                    Icon = icon,
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

            if (!string.IsNullOrWhiteSpace(Text))
            {
                button.Add(new HtmlText(I18N.Translate(renderContext.Request?.Culture, text)));
            }

            PrimaryAction?.ApplyUserAttributes(button, TypeAction.Primary);
            SecondaryAction?.ApplyUserAttributes(button, TypeAction.Secondary);

            var dropdownButton = new HtmlElementTextSemanticsSpan(new HtmlElementTextSemanticsSpan() { Class = "caret" })
            {
                Id = string.IsNullOrWhiteSpace(Id) ? "" : Id + "_btn",
                Class = Css.Concatenate("btn dropdown-toggle dropdown-toggle-split", Css.Remove(GetClasses(), "btn-block", Margin.ToClass())),
                Style = GetStyles()
            };
            dropdownButton.AddUserAttribute("data-bs-toggle", "dropdown");
            dropdownButton.AddUserAttribute("aria-expanded", "false");

            var dropdownElements = new HtmlElementTextContentUl
                (
                    [.. items.Select
                    (
                        x =>
                        x is null || x is ControlDropdownItemDivider || x is ControlLine ?
                        new HtmlElementTextContentLi() { Class = "dropdown-divider", Inline = true } :
                        x is ControlDropdownItemHeader ?
                        x.Render(renderContext, visualTree) :
                        new HtmlElementTextContentLi(x.Render(renderContext, visualTree)) { Class = "dropdown-item" }
                    )]
                )
            {
                Class = HorizontalAlignment == TypeHorizontalAlignment.Right ? "dropdown-menu dropdown-menu-right" : "dropdown-menu"
            };

            var html = new HtmlElementTextContentDiv
            (
                button,
                dropdownButton,
                dropdownElements
            )
            {
                Id = Id,
                Class = Css.Concatenate
                (
                    "btn-group",
                    Margin.ToClass(),
                    (Block == TypeBlockButton.Block ? "btn-block" : "")
                ),
                Role = Role
            };

            return html;
        }
    }
}
