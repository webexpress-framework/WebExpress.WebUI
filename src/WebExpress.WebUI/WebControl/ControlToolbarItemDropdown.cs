using System;
using System.Collections.Generic;
using System.Data;
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
    /// Represents a toolbar item dropdown control.
    /// </summary>
    /// <remarks>
    /// This class is used to create a dropdown within a toolbar.
    /// </remarks>
    public class ControlToolbarItemDropdown : IControlToolbarItemDropdown
    {
        private readonly string _id;
        private readonly List<IControlDropdownItem> _items = [];

        /// <summary>
        /// Returns the items in the dropdown.
        /// </summary>
        public IEnumerable<IControlDropdownItem> Items => _items;


        /// <summary>
        /// Returns the unique identifier for the entity.
        /// </summary>
        public string Id => _id;

        /// <summary>
        /// Gets or sets the color. 
        /// </summary>
        public Func<IRenderControlContext, PropertyColorText> Color { get; set; }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public Func<IRenderControlContext, TypeSizeButton> Size { get; set; } = _ => TypeSizeButton.Default;

        /// <summary>
        /// Gets or sets the outline property.
        /// </summary>
        public Func<IRenderControlContext, bool> Outline { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets whether the button should take up the full width.
        /// </summary>
        public Func<IRenderControlContext, TypeBlockButton> Block { get; set; } = _ => TypeBlockButton.None;

        /// <summary>
        /// Gets or sets an indicator that indicates that a menu is present.
        /// </summary>
        public Func<IRenderControlContext, TypeToggleDropdown> Toggle { get; set; } = _ => TypeToggleDropdown.None;

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
        public Func<IRenderControlContext, TypeActive> Active { get; set; } = _ => TypeActive.None;

        /// <summary>
        /// Gets or sets the orientation of the menu.
        /// </summary>
        public Func<IRenderControlContext, TypeAlignmentDropdownMenu> AlignmentMenu { get; set; } = _ => TypeAlignmentDropdownMenu.Default;


        /// <summary>
        /// Gets or sets the alignment of the toolbar item.
        /// </summary>
        public Func<IRenderControlContext, TypeToolbarItemAlignment> Alignment { get; set; } = _ => TypeToolbarItemAlignment.Default;

        /// <summary>
        /// Gets the overflow behavior of the toolbar item.
        /// </summary>
        public Func<IRenderControlContext, TypeToolbarItemOverflow> Overflow { get; set; } = _ => TypeToolbarItemOverflow.Default;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlToolbarItemDropdown(string id = null)
        {
            _id = id;
        }

        /// <summary>
        /// Adds one or more items to the dropdown.
        /// </summary>
        /// <param name="items">The items to add to the dropdown.</param>
        /// <remarks>
        /// This method allows adding one or multiple dropdown items to the items collection of 
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
        public IControlToolbarItemDropdown Add(params IControlDropdownItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the dropdown.
        /// </summary>
        /// <param name="items">The items to add to the dropdown.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlToolbarItemDropdown Add(IEnumerable<IControlDropdownItem> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds a new separator.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        public IControlToolbarItemDropdown AddSeparator()
        {
            _items.Add(null);

            return this;
        }

        /// <summary>
        /// Adds a new head.
        /// </summary>
        /// <param name="text">The headline text.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlToolbarItemDropdown AddHeader(string text)
        {
            _items.Add(new ControlDropdownItemHeader() { Text = _ => text });

            return this;
        }

        /// <summary>
        /// Removes the specified item from the dropdown control.
        /// </summary>
        /// <param name="item">The dropdown item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlToolbarItemDropdown Remove(IControlDropdownItem item)
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
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var icon = Icon?.Invoke(renderContext);

            return Render(renderContext, visualTree, _items, icon);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="items">The items in the dropdown.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<IControlDropdownItem> items)
        {
            var icon = Icon?.Invoke(renderContext);

            return Render(renderContext, visualTree, items, icon);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="items">The items in the dropdown.</param>
        /// <param name="icon">The icon for the dropdown.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<IControlDropdownItem> items, IIcon icon)
        {
            var color = Color?.Invoke(renderContext);
            var size = Size?.Invoke(renderContext) ?? TypeSizeButton.Default;
            var block = Block?.Invoke(renderContext) ?? TypeBlockButton.None;
            var alignmentMenu = AlignmentMenu?.Invoke(renderContext) ?? TypeAlignmentDropdownMenu.Default;
            var text = Text?.Invoke(renderContext);
            var tooltip = Tooltip?.Invoke(renderContext);
            var image = Image?.Invoke(renderContext);
            var toggle = Toggle?.Invoke(renderContext) ?? TypeToggleDropdown.None;
            var active = Active?.Invoke(renderContext) ?? TypeActive.None;
            var alignment = Alignment?.Invoke(renderContext) ?? TypeToolbarItemAlignment.Default;
            var overflow = Overflow?.Invoke(renderContext) ?? TypeToolbarItemOverflow.Default;

            var buttonCss = "";

            if (size != TypeSizeButton.Default)
            {
                buttonCss = Css.Concatenate(size.ToClass(), buttonCss);
            }

            if (block != TypeBlockButton.None)
            {
                buttonCss = Css.Concatenate(block.ToClass(), buttonCss);
            }

            if (alignmentMenu != TypeAlignmentDropdownMenu.Default)
            {
                buttonCss = Css.Concatenate(alignmentMenu.ToClass(), buttonCss);
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = _id,
                Class = Css.Concatenate("wx-toolbar-dropdown", buttonCss)
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, text))
                .AddUserAttribute("data-title", I18N.Translate(renderContext, tooltip))
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-image", image?.ToString() ?? (icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color-css", color?.ToClass())
                .AddUserAttribute("data-color-style", color?.ToStyle())
                .AddUserAttribute("data-toggle", toggle == TypeToggleDropdown.Toggle ? "true" : null)
                .AddUserAttribute(active == TypeActive.Active ? "active" : null)
                .AddUserAttribute(active == TypeActive.Disabled ? "disabled" : null)
                .AddUserAttribute("data-align", alignment.ToValue())
                .AddUserAttribute("data-overflow", overflow.ToValue())
                .Add(items.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
