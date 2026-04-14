using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that combines an avatar display with a dropdown menu.
    /// The avatar acts as the trigger element; clicking it opens the associated dropdown menu.
    /// </summary>
    public class ControlAvatarDropdown : Control, IControlDropdown
    {
        private readonly List<IControlDropdownItem> _items = [];

        /// <summary>
        /// Returns the items in the dropdown.
        /// </summary>
        public IEnumerable<IControlDropdownItem> Items => _items;

        /// <summary>
        /// Returns or sets the display name for the avatar.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Returns or sets the image source for the avatar.
        /// </summary>
        public IUri Image { get; set; }

        /// <summary>
        /// Returns or sets the initials fallback for the avatar.
        /// </summary>
        public string Initials { get; set; }

        /// <summary>
        /// Returns or sets the shape of the avatar thumbnail (circle or rect).
        /// </summary>
        public TypeShapeAvatar Shape { get; set; }

        /// <summary>
        /// Returns or sets the size of the avatar thumbnail in pixels.
        /// </summary>
        public int Size { get; set; } = -1;

        /// <summary>
        /// Returns or sets the color.
        /// </summary>
        public PropertyColorButton Color { get; set; }

        /// <summary>
        /// Returns or sets the orientation of the menu.
        /// </summary>
        public TypeAlignmentDropdownMenu AlignmentMenu { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with the specified id and items.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The items to be added to the dropdown.</param>
        public ControlAvatarDropdown(string id = null, params IControlDropdownItem[] items)
            : base(id)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds one or more items to the dropdown.
        /// </summary>
        /// <param name="items">The items to add to the dropdown.</param>
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
        /// Adds a new header.
        /// </summary>
        /// <param name="text">The headline text.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlDropdown AddHeader(string text)
        {
            _items.Add(new ControlDropdownItemHeader() { Text = text });

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
            var menuCss = "";

            if (AlignmentMenu != TypeAlignmentDropdownMenu.Default)
            {
                menuCss = AlignmentMenu.ToClass();
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-avatar-dropdown", GetClasses()),
                Role = Role ?? "button"
            }
                .AddUserAttribute("data-name", I18N.Translate(renderContext, Name))
                .AddUserAttribute("data-src", Image?.ToString())
                .AddUserAttribute("data-initials", Initials)
                .AddUserAttribute("data-shape", Shape != TypeShapeAvatar.Circle ? Shape.ToValue() : null)
                .AddUserAttribute("data-size", Size > 0 ? Size.ToString() : null)
                .AddUserAttribute("data-color", Color?.ToClass(false))
                .AddUserAttribute("data-menuCss", menuCss)
                .Add(_items.Select(x => x?.Render(renderContext, visualTree)));

            return html;
        }
    }
}
