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
        /// Returns or sets the background color.
        /// </summary>
        public new PropertyColorButton BackgroundColor
        {
            get => (PropertyColorButton)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(Outline), () => value?.ToStyle(Outline));
        }

        /// <summary>
        /// Returns or sets the size.
        /// </summary>
        public TypeSizeButton Size
        {
            get => (TypeSizeButton)GetProperty(TypeSizeButton.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets the outline property
        /// </summary>
        public bool Outline { get; set; }

        /// <summary>
        /// Returns or sets whether the button should take up the full width.
        /// </summary>
        public TypeBlockButton Block
        {
            get => (TypeBlockButton)GetProperty(TypeBlockButton.None);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets the text.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Returns or sets the value.
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// Returns or sets the icon.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Returns or sets the activation status of the button.
        /// </summary>
        public TypeActive Active
        {
            get => (TypeActive)GetProperty(TypeActive.None);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        public IAction PrimaryAction { get; set; }

        /// <summary>
        /// Returns or sets the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        public IAction SecondaryAction { get; set; }

        /// <summary>
        /// Returns or sets the content.
        /// </summary>
        public IEnumerable<IControlSplitButtonItem> Items => _items;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="items">The content of the html element.</param>
        public ControlSplitButton(string id = null, params IControlSplitButtonItem[] items)
            : base(id)
        {
            Size = TypeSizeButton.Default;
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
            _items.Add(new ControlSplitButtonItemHeader() { Text = text });

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
            var button = new HtmlElementFieldButton()
            {
                Id = string.IsNullOrWhiteSpace(Id) ? "" : Id + "_btn",
                Class = Css.Concatenate("btn", Css.Remove(GetClasses(), Margin.ToClass())),
                Style = GetStyles()
            };

            if (Icon is not null)
            {
                button.Add(new ControlIcon()
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

            if (!string.IsNullOrWhiteSpace(Text))
            {
                button.Add(new HtmlText(Text));
            }

            PrimaryAction?.ApplyUserAttributes(button, TypeAction.Primary);
            SecondaryAction?.ApplyUserAttributes(button, TypeAction.Secondary);

            var dropdownButton = new HtmlElementFieldButton(new HtmlElementTextSemanticsSpan() { Class = "caret" })
            {
                Id = string.IsNullOrWhiteSpace(Id) ? "" : Id + "_toggle",
                Class = Css.Concatenate("btn dropdown-toggle dropdown-toggle-split", Css.Remove(GetClasses(), "btn-block", Margin.ToClass())),
                Style = GetStyles(),
                DataToggle = "dropdown"
            };
            dropdownButton.AddUserAttribute("data-bs-toggle", "dropdown");
            dropdownButton.AddUserAttribute("aria-expanded", "false");

            var dropdownElements = new HtmlElementTextContentUl
                (
                    Items.Select
                    (
                        x =>
                        x is null || x is ControlDropdownItemDivider || x is ControlLine ?
                        new HtmlElementTextContentLi() { Class = "dropdown-divider", Inline = true } :
                        x is ControlDropdownItemHeader ?
                        x.Render(renderContext, visualTree) :
                        new HtmlElementTextContentLi(x.Render(renderContext, visualTree)) { Class = "dropdown-item" }
                    ).ToArray()
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
