using System;
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
        public Func<IRenderControlContext, TypeTarget> Target { get; set; }

        /// <summary>
        /// Gets or sets the uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The content of the html element.</param>
        public ControlSplitButtonLink(string id = null, params IControlSplitButtonItem[] items)
            : base(id, items)
        {
            Size = _ => TypeSizeButton.Default;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            return Render(renderContext, visualTree, Text?.Invoke(renderContext), Uri?.Invoke(renderContext), PrimaryAction?.Invoke(renderContext), SecondaryAction?.Invoke(renderContext), Icon?.Invoke(renderContext), [.. Items]);
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
        /// <param name="items">The dropdown items associated with the split button.</param>
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
            var margin = Margin?.Invoke(renderContext);
            var horizontalAlignment = HorizontalAlignment?.Invoke(renderContext);
            var role = Role?.Invoke(renderContext);
            var target = Target?.Invoke(renderContext) ?? TypeTarget.None;

            var button = new HtmlElementTextSemanticsA()
            {
                Id = string.IsNullOrWhiteSpace(Id) ? "" : Id + "_btn",
                Class = Css.Concatenate("btn", Css.Remove(GetClasses(renderContext), margin?.ToClass())),
                Style = GetStyles(renderContext),
                Target = target,
                Href = uri?.ToString()
            };

            if (icon is not null)
            {
                button.Add(new ControlIcon()
                {
                    Icon = _ => icon,
                    Margin = _ => !string.IsNullOrWhiteSpace(text) ? new PropertySpacingMargin
                    (
                        PropertySpacing.Space.None,
                        PropertySpacing.Space.Two,
                        PropertySpacing.Space.None,
                        PropertySpacing.Space.None
                    ) : new PropertySpacingMargin(PropertySpacing.Space.None),
                    VerticalAlignment = _ => TypeVerticalAlignment.Default
                }.Render(renderContext, visualTree));
            }

            if (!string.IsNullOrWhiteSpace(text))
            {
                button.Add(new HtmlText(I18N.Translate(renderContext.Request?.Culture, text)));
            }

            primaryAction?.ApplyUserAttributes(button, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(button, TypeAction.Secondary);

            var dropdownButton = new HtmlElementTextSemanticsSpan(new HtmlElementTextSemanticsSpan() { Class = "caret" })
            {
                Id = string.IsNullOrWhiteSpace(Id) ? "" : Id + "_btn",
                Class = Css.Concatenate("btn dropdown-toggle dropdown-toggle-split", Css.Remove(GetClasses(renderContext), "btn-block", margin?.ToClass())),
                Style = GetStyles(renderContext)
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
                Class = horizontalAlignment == TypeHorizontalAlignment.Right ? "dropdown-menu dropdown-menu-right" : "dropdown-menu"
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
                    margin?.ToClass(),
                    (Block?.Invoke(renderContext) == TypeBlockButton.Block ? "btn-block" : "")
                ),
                Role = role
            };

            return html;
        }
    }
}
