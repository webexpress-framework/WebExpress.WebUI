using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a split button control that can contain multiple items.
    /// </summary>
    public class ControlSplitButton : Control, IControlSplitButton
    {
        private readonly List<IControlSplitButtonItem> _items = [];

        /// <summary>
        /// Gets or sets the background color.
        /// </summary>
        public new Func<IRenderControlContext, PropertyColorButton> BackgroundColor
        {
            get => (Func<IRenderControlContext, PropertyColorButton>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null)?.ToClass(Outline?.Invoke(null) ?? false), () => value?.Invoke(null)?.ToStyle(Outline?.Invoke(null) ?? false));
        }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public Func<IRenderControlContext, TypeSizeButton> Size
        {
            get => (Func<IRenderControlContext, TypeSizeButton>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the outline property
        /// </summary>
        public Func<IRenderControlContext, bool> Outline { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets whether the button should take up the full width.
        /// </summary>
        public Func<IRenderControlContext, TypeBlockButton> Block
        {
            get => (Func<IRenderControlContext, TypeBlockButton>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the value.
        /// </summary>
        public Func<IRenderControlContext, string> Value { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the activation status of the button.
        /// </summary>
        public Func<IRenderControlContext, TypeActive> Active
        {
            get => (Func<IRenderControlContext, TypeActive>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        public Func<IRenderControlContext, IAction> PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        public Func<IRenderControlContext, IAction> SecondaryAction { get; set; }

        /// <summary>
        /// Gets or sets the content.
        /// </summary>
        public IEnumerable<IControlSplitButtonItem> Items => _items;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="items">The content of the html element.</param>
        public ControlSplitButton(string id = null, params IControlSplitButtonItem[] items)
            : base(id)
        {
            Size = _ => TypeSizeButton.Default;
            Block = _ => TypeBlockButton.None;
            Active = _ => TypeActive.None;
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds one or more items to the split button.
        /// </summary>
        /// <param name="items">The items to add to the split button.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlSplitButton Add(params IControlSplitButtonItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the split button.
        /// </summary>
        /// <param name="items">The items to add to the split button.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlSplitButton Add(IEnumerable<IControlSplitButtonItem> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds a divider to the split button.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        public IControlSplitButton AddDivider()
        {
            _items.Add(null);

            return this;
        }

        /// <summary>
        /// Adds a header item to the split button.
        /// </summary>
        /// <param name="text">The text of the header item.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlSplitButton AddHeader(string text)
        {
            _items.Add(new ControlSplitButtonItemHeader() { Text = _ => text });

            return this;
        }

        /// <summary>
        /// Removes a item from the content of the split button.
        /// </summary>
        /// <param name="items">The items to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlSplitButton Remove(IControlSplitButtonItem items)
        {
            _items.Remove(items);

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var margin = Margin?.Invoke(renderContext);
            var horizontalAlignment = HorizontalAlignment?.Invoke(renderContext);
            var icon = Icon?.Invoke(renderContext);
            var text = Text?.Invoke(renderContext);
            var role = Role?.Invoke(renderContext);

            var button = new HtmlElementFieldButton()
            {
                Id = string.IsNullOrWhiteSpace(Id) ? "" : Id + "_btn",
                Class = Css.Concatenate("btn", Css.Remove(GetClasses(), margin?.ToClass())),
                Style = GetStyles()
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
                button.Add(new HtmlText(text));
            }

            PrimaryAction?.Invoke(renderContext)?.ApplyUserAttributes(button, TypeAction.Primary);
            SecondaryAction?.Invoke(renderContext)?.ApplyUserAttributes(button, TypeAction.Secondary);

            var dropdownButton = new HtmlElementFieldButton(new HtmlElementTextSemanticsSpan() { Class = "caret" })
            {
                Id = string.IsNullOrWhiteSpace(Id) ? "" : Id + "_toggle",
                Class = Css.Concatenate("btn dropdown-toggle dropdown-toggle-split", Css.Remove(GetClasses(), "btn-block", margin?.ToClass())),
                Style = GetStyles(),
                DataToggle = "dropdown"
            };
            dropdownButton.AddUserAttribute("data-bs-toggle", "dropdown");
            dropdownButton.AddUserAttribute("aria-expanded", "false");

            var dropdownElements = new HtmlElementTextContentUl
                (
                    [.. Items.Select
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
