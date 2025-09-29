using System.Collections.Generic;
using System.Data;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
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
        /// Returns or sets the color. 
        /// </summary>
        public PropertyColorText Color { get; set; }

        /// <summary>
        /// Returns or sets the size.
        /// </summary>
        public TypeSizeButton Size { get; set; }

        /// <summary>
        /// Returns or sets the outline property.
        /// </summary>
        public bool Outline { get; set; }

        /// <summary>
        /// Returns or sets whether the button should take up the full width.
        /// </summary>
        public TypeBlockButton Block { get; set; }

        /// <summary>
        /// Returns or sets an indicator that indicates that a menu is present.
        /// </summary>
        public TypeToggleDropdown Toggle { get; set; }

        /// <summary>
        /// Returns or sets the label.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Returns or sets the tooltip.
        /// </summary>
        public string Tooltip { get; set; }

        /// <summary>
        /// Returns or sets the icon.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Returns or sets the activation status of the button.
        /// </summary>
        public TypeActive Active { get; set; }

        /// <summary>
        /// Returns or sets the orientation of the menu.
        /// </summary>
        public TypeAlignmentDropdownMenu AlignmentMenu { get; set; }


        /// <summary>
        /// Returns or sets the alignment of the toolbar item.
        /// </summary>
        public TypeToolbarItemAlignment Alignment { get; set; } = TypeToolbarItemAlignment.Default;

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
        public IControlToolbarItemDropdown AddSeperator()
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
            _items.Add(new ControlDropdownItemHeader() { Text = text });

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
            var buttonCss = "";

            if (Size != TypeSizeButton.Default)
            {
                buttonCss = Css.Concatenate(Size.ToClass(), buttonCss);
            }

            if (Block != TypeBlockButton.None)
            {
                buttonCss = Css.Concatenate(Block.ToClass(), buttonCss);
            }

            if (AlignmentMenu != TypeAlignmentDropdownMenu.Default)
            {
                buttonCss = Css.Concatenate(AlignmentMenu.ToClass(), buttonCss);
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = _id,
                Class = Css.Concatenate("wx-toolbar-dropdown", buttonCss)
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Text))
                .AddUserAttribute("data-title", I18N.Translate(renderContext, Tooltip))
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", (Icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color-css", Color?.ToClass())
                .AddUserAttribute("data-color-style", Color?.ToStyle())
                .AddUserAttribute("data-toggle", Toggle == TypeToggleDropdown.Toggle ? "true" : null)
                .AddUserAttribute(Active == TypeActive.Active ? "active" : null)
                .AddUserAttribute(Active == TypeActive.Disabled ? "disabled" : null)
                .AddUserAttribute("data-align", Alignment.ToValue())
                .Add(_items.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
