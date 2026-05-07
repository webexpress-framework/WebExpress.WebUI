using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
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
        /// Gets or sets the color. 
        /// </summary>
        public Func<IRenderControlContext, PropertyColorButton> Color { get; set; }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public Func<IRenderControlContext, TypeSizeButton> Size { get; set; }

        /// <summary>
        /// Gets or sets the outline property.
        /// </summary>
        public Func<IRenderControlContext, bool> Outline { get; set; }

        /// <summary>
        /// Gets or sets whether the button should take up the full width.
        /// </summary>
        public Func<IRenderControlContext, TypeBlockButton> Block { get; set; }

        /// <summary>
        /// Gets or sets an indicator that indicates that a menu is present.
        /// </summary>
        public Func<IRenderControlContext, TypeToggleDropdown> Toggle { get; set; }

        /// <summary>
        /// Gets or sets the label.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the tooltip.
        /// </summary>
        public Func<IRenderControlContext, string> Tooltip { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the activation status of the button.
        /// </summary>
        public Func<IRenderControlContext, TypeActive> Active { get; set; }

        /// <summary>
        /// Gets or sets the orientation of the menu.
        /// </summary>
        public Func<IRenderControlContext, TypeAlignmentDropdownMenu> AlignmentMenu { get; set; }

        /// <summary>
        /// Gets or sets the height.
        /// </summary>
        public new Func<IRenderControlContext, int> Height { get; set; } = _ => -1;

        /// <summary>
        /// Gets or sets the width.
        /// </summary>
        public new Func<IRenderControlContext, int> Width { get; set; } = _ => -1;

        /// <summary>
        /// Initializes a new instance of the class with the specified id and items.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The items to be added to the dropdown.</param>
        public ControlDropdown(string id = null, params IControlDropdownItem[] items)
            : base(id)
        {
            _items.AddRange(items);

            Size = _ => TypeSizeButton.Default;
        }

        /// <summary>
        /// Adds one or more items to the dropdown.
        /// </summary>
        /// <param name="items">The items to add to the dropdown.</param>
        /// <remarks>
        /// This method allows adding one or multiple dropdown items to the <see cref="Items"/> collection of 
        /// the dropdown control. It is useful for dynamically constructing the dropdown menu by appending 
        /// various items to it.
        /// 
        /// Example usage:
        /// <code>
        /// var dropdown = new DropdownControl();
        /// var item1 = new ControlDropdownItemLink { Text = "Option 1" };
        /// var item2 = new ControlDropdownItemLink { Text = "Option 2" };
        /// dropdown.Add(item1, item2);
        /// </code>
        /// 
        /// This method accepts any item that implements the <see cref="IControlDropdownItem"/> interface.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public IControlDropdown Add(params IControlDropdownItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the dropdown.
        /// </summary>
        /// <param name="items">The items to add to the dropdown.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlDropdown Add(IEnumerable<IControlDropdownItem> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds a new separator.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        public IControlDropdown AddSeparator()
        {
            _items.Add(new ControlDropdownItemDivider());

            return this;
        }

        /// <summary>
        /// Adds a new head.
        /// </summary>
        /// <param name="text">The headline text.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlDropdown AddHeader(string text)
        {
            _items.Add(new ControlDropdownItemHeader() { Text = _ => text });

            return this;
        }

        /// <summary>
        /// Removes the specified item from the dropdown control.
        /// </summary>
        /// <param name="item">The dropdown item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlDropdown Remove(IControlDropdownItem item)
        {
            _items.Remove(item);

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
            var buttonCss = "";
            var buttonStyle = "";
            var menuCss = "";
            var role = Role?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);
            var outline = Outline?.Invoke(renderContext) ?? false;
            var size = Size?.Invoke(renderContext);
            var block = Block?.Invoke(renderContext);
            var toggle = Toggle?.Invoke(renderContext);
            var alignmentMenu = AlignmentMenu?.Invoke(renderContext);
            var icon = Icon?.Invoke(renderContext);
            var image = Image?.Invoke(renderContext);
            var text = Text?.Invoke(renderContext);
            var active = Active?.Invoke(renderContext);

            if (color is not null)
            {
                buttonCss = Css.Concatenate(color?.ToClass(outline), buttonCss);
                buttonStyle = Style.Concatenate(color?.ToStyle(), buttonStyle);
            }

            if (size != TypeSizeButton.Default)
            {
                buttonCss = Css.Concatenate(size?.ToClass(), buttonCss);
            }

            if (block != TypeBlockButton.None)
            {
                buttonCss = Css.Concatenate(block?.ToClass(), buttonCss);
            }

            if (toggle != TypeToggleDropdown.None)
            {
                buttonCss = Css.Concatenate(toggle?.ToClass(), buttonCss);
            }

            if (alignmentMenu != TypeAlignmentDropdownMenu.Default)
            {
                menuCss = Css.Concatenate(alignmentMenu?.ToClass(), menuCss);
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-dropdown", GetClasses()),
                Role = role ?? "button"
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, text))
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-image", image?.ToString() ?? (icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-buttonCss", buttonCss)
                .AddUserAttribute("data-buttonStyle", buttonStyle)
                .AddUserAttribute("data-menuCss", menuCss)
                .AddUserAttribute(active == TypeActive.Active ? "active" : null)
                .AddUserAttribute(active == TypeActive.Disabled ? "disabled" : null)
                .Add(_items.Select(x => x?.Render(renderContext, visualTree)));

            return html;
        }
    }
}
