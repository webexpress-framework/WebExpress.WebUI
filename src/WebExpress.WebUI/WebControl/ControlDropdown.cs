using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a dropdown control that can contain multiple items.
    /// </summary>
    public class ControlDropdown : Control, IControlDropdown, IControlNavigationItem
    {
        private readonly List<IControlDropdownItem> _items = [];

        /// <summary>
        /// Returns the items in the dropdown.
        /// </summary>
        public IEnumerable<IControlDropdownItem> Items => _items;

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
        /// Returns or sets the outline property.
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
        /// Returns or sets an indicator that indicates that a menu is present.
        /// </summary>
        public TypeToggleDropdown Toggle
        {
            get => (TypeToggleDropdown)GetProperty(TypeToggleDropdown.None);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets the text.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Returns or sets the tooltip.
        /// </summary>
        public string Tooltip { get; set; }

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
        /// Returns or sets the orientation of the menu.
        /// </summary>
        public TypeAlignmentDropdownMenu AlignmentMenu
        {
            get => (TypeAlignmentDropdownMenu)GetProperty(TypeAlignmentDropdownMenu.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets the image.
        /// </summary>
        public string Image { get; set; }

        /// <summary>
        /// Returns or sets the height.
        /// </summary>
        public new int Height { get; set; } = -1;

        /// <summary>
        /// Returns or sets the width.
        /// </summary>
        public new int Width { get; set; } = -1;

        /// <summary>
        /// Initializes a new instance of the class with the specified id and items.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The items to be added to the dropdown.</param>
        public ControlDropdown(string id = null, params IControlDropdownItem[] items)
            : base(id)
        {
            _items.AddRange(items);

            Size = TypeSizeButton.Default;
        }

        /// <summary>
        /// Adds one or more items to the dropdown.
        /// </summary>
        /// <param name="items">The items to add to the dropdown.</param>
        /// <remarks>
        /// This method allows adding one or multiple dropdown items to the <see cref="Items"/> collection of 
        /// the dropdown control. It is useful for dynamically constructing the dropdown menu by appending 
        /// various items to it.
        /// Example usage:
        /// <code>
        /// var dropdown = new DropdownControl();
        /// var item1 = new ControlDropdownItemLink { Text = "Option 1" };
        /// var item2 = new ControlDropdownItemLink { Text = "Option 2" };
        /// dropdown.Add(item1, item2);
        /// </code>
        /// This method accepts any item that implements the <see cref="IControlDropdownItem"/> interface.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public IControlDropdown Add(params IControlDropdownItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds a new separator.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        public IControlDropdown AddSeperator()
        {
            _items.Add(null);

            return this;
        }

        /// <summary>
        /// Adds a new head.
        /// </summary>
        /// <param name="text">The headline text.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlDropdown AddHeader(string text)
        {
            _items.Add(new ControlDropdownItemHeader() { Text = text });

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
            return Render(renderContext, visualTree, Items);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="items">The items to be included in the dropdown.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<IControlDropdownItem> items)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("dropdown", Margin.ToClass()),
                Role = Role
            };

            if (Image == null)
            {
                var button = new HtmlElementFieldButton()
                {
                    Id = string.IsNullOrWhiteSpace(Id) ? "" : Id + "_btn",
                    Class = Css.Concatenate("btn", Css.Remove(GetClasses(), Margin.ToClass())),
                    Style = GetStyles(),
                    Title = I18N.Translate(Tooltip)
                };
                button.AddUserAttribute("data-bs-toggle", "dropdown");
                button.AddUserAttribute("aria-expanded", "false");

                if (Icon != null)
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
                    button.Add(new HtmlText(I18N.Translate(renderContext.Request.Culture, Text)));
                }

                html.Add(button);
            }
            else
            {
                var button = new HtmlElementMultimediaImg()
                {
                    Id = string.IsNullOrWhiteSpace(Id) ? "" : Id + "_btn",
                    Class = Css.Concatenate("btn", Css.Remove(GetClasses(), Margin.ToClass())),
                    Style = GetStyles(),
                    Src = Image.ToString()
                };
                button.AddUserAttribute("data-bs-toggle", "dropdown");
                button.AddUserAttribute("aria-expanded", "false");

                if (Height > 0)
                {
                    button.Height = Height;
                }

                if (Width > 0)
                {
                    button.Width = Width;
                }

                html.Add(button);
            }

            html.Add
            (
                new HtmlElementTextContentUl
                (
                    items.Select
                    (
                        x =>
                        x == null || x is ControlDropdownItemDivider || x is ControlLine ?
                        new HtmlElementTextContentLi() { Class = "dropdown-divider", Inline = true } :
                        x is ControlDropdownItemHeader ?
                        x.Render(renderContext, visualTree) :
                        new HtmlElementTextContentLi(x.Render(renderContext, visualTree)) { Class = "dropdown-item " + ((x as ControlDropdownItemLink).Active == TypeActive.Disabled ? "disabled" : "") }
                    ).ToArray()
                )
                {
                    Class = Css.Concatenate
                    (
                        "dropdown-menu",
                        AlignmentMenu.ToClass()
                    )
                }
            );

            return html;
        }
    }
}
