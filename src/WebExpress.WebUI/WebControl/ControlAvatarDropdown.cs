using System;
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
        /// Gets or sets the display name for the avatar.
        /// </summary>
        public Func<IRenderControlContext, string> User { get; set; }

        /// <summary>
        /// Gets or sets the image source for the avatar.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the initials fallback for the avatar.
        /// </summary>
        public Func<IRenderControlContext, string> Initials { get; set; }

        /// <summary>
        /// Gets or sets the shape of the avatar thumbnail (circle or rect).
        /// </summary>
        public Func<IRenderControlContext, TypeShapeAvatar> Shape { get; set; }

        /// <summary>
        /// Gets or sets the size of the avatar thumbnail in pixels.
        /// </summary>
        public Func<IRenderControlContext, int> Size { get; set; } = _ => -1;

        /// <summary>
        /// Gets or sets the color.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorButton> Color { get; set; }

        /// <summary>
        /// Gets or sets the orientation of the menu.
        /// </summary>
        public Func<IRenderControlContext, TypeAlignmentDropdownMenu> AlignmentMenu { get; set; }

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
            var menuCss = "";
            var alignmentMenu = AlignmentMenu?.Invoke(renderContext) ?? TypeAlignmentDropdownMenu.Default;

            if (alignmentMenu != TypeAlignmentDropdownMenu.Default)
            {
                menuCss = alignmentMenu.ToClass();
            }

            var role = Role?.Invoke(renderContext);
            var username = User?.Invoke(renderContext);
            var shape = Shape?.Invoke(renderContext) ?? TypeShapeAvatar.Circle;
            var initials = Initials?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);
            var size = Size?.Invoke(renderContext) ?? -1;
            var image = Image?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-avatar-dropdown", GetClasses()),
                Role = role ?? "button"
            }
                .AddUserAttribute("data-name", I18N.Translate(renderContext, username))
                .AddUserAttribute("data-src", image?.ToString())
                .AddUserAttribute("data-initials", initials)
                .AddUserAttribute("data-shape", shape != TypeShapeAvatar.Circle ? shape.ToValue() : null)
                .AddUserAttribute("data-size", size > 0 ? size.ToString() : null)
                .AddUserAttribute("data-color", color?.ToClass(false))
                .AddUserAttribute("data-menuCss", menuCss)
                .Add(_items.Select(x => x?.Render(renderContext, visualTree)));

            return html;
        }
    }
}
