using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a toolbar control that can contain various toolbar items.
    /// </summary>
    public class ControlToolbar : Control, IControlToolbar
    {
        private List<IControlToolbarItem> _items = [];

        /// <summary>
        /// Returns the list of toolbar items.
        /// </summary>
        /// <value>
        /// A list of <see cref="IControlToolbarItem"/> representing the items in the toolbar.
        /// </value>
        public virtual IEnumerable<IControlToolbarItem> Items => _items;

        /// <summary>
        /// Returns or sets the orientation of the toolbar.
        /// </summary>
        public virtual TypeOrientationToolBar Orientation
        {
            get => (TypeOrientationToolBar)GetProperty(TypeOrientationToolBar.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets the fixed position of the toolbar.
        /// </summary>
        public virtual TypeFixed Fixed
        {
            get => (TypeFixed)GetProperty(TypeFixed.None);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets the sticky position of the toolbar.
        /// </summary>
        public virtual TypeSticky Sticky
        {
            get => (TypeSticky)GetProperty(TypeSticky.None);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">Die Toolitems</param>
        public ControlToolbar(string id = null, params IControlToolbarItem[] items)
            : base(id)
        {
            Orientation = TypeOrientationToolBar.Default;
            Padding = new PropertySpacingPadding(PropertySpacing.Space.Two, PropertySpacing.Space.None);

            _items.AddRange(items);
        }

        /// <summary>
        /// Adds one or more toolbar items to the toolbar.
        /// </summary>
        /// <param name="items">The toolbar items to add.</param>
        /// <remarks>
        /// This method appends the specified collection of <see cref="IControlToolbarItem"/> instances to the 
        /// current tool bar. It ensures that the new items are concatenated with the existing ones, 
        /// maintaining the order of addition.
        /// Example usage:
        /// <code>
        /// var tool = new ControlToolbar();
        /// var item1 = new ControlToolBarItemButton { Text = "Item 1" };
        /// var item2 = new ControlToolBarItemButton { Text = "Item 2" };
        /// tool.Add(item1, item2);
        /// </code>
        /// This method accepts any item that derives from <see cref="ControlListItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public IControlToolbar Add(params IControlToolbarItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more toolbar items to the toolbar.
        /// </summary>
        /// <param name="items">The toolbar items to add.</param>
        /// <remarks>
        /// This method appends the specified collection of <see cref="IControlToolbarItem"/> instances to the 
        /// current tool bar. It ensures that the new items are concatenated with the existing ones, 
        /// maintaining the order of addition.
        /// Example usage:
        /// <code>
        /// var tool = new ControlToolbar();
        /// var item1 = new ControlToolBarItemButton { Text = "Item 1" };
        /// var item2 = new ControlToolBarItemButton { Text = "Item 2" };
        /// tool.Add(new List<IControlToolbarItem>([ item1, item2 ]));
        /// </code>
        /// This method accepts any item that derives from <see cref="IControlToolbarItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public IControlToolbar Add(IEnumerable<IControlToolbarItem> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes a toolbar item from the toolbar.
        /// </summary>
        /// <param name="item">The toolbar item to remove.</param>
        /// <remarks>
        /// This method removes the specified <see cref="IControlToolbarItem"/> instance from the 
        /// current tool bar. If the item does not exist in the tool bar, the method does nothing.
        /// Example usage:
        /// <code>
        /// var tool = new ControlToolbar();
        /// var item = new ControlToolBarItemButton { Text = "Item 1" };
        /// tool.Add(item);
        /// tool.Remove(item);
        /// </code>
        /// This method accepts any item that derives from <see cref="IControlToolbarItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public IControlToolbar Remove(IControlToolbarItem item)
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
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<IControlToolbarItem> items)
        {
            if (!Enable)
            {
                return null;
            }

            var html = new HtmlElementSectionNav()
            {
                Id = Id,
                Class = GetClasses(),
                Style = GetStyles(),
                Role = Role
            };

            html.Add
            (
                new HtmlElementTextContentUl
                (
                    items.Select
                    (
                        x =>
                        x == null || x is ControlDropdownItemDivider || x is ControlLine ?
                        new HtmlElementTextContentLi() { Class = "divider", Inline = true } :
                        x is ControlDropdownItemHeader ?
                        x.Render(renderContext, visualTree) :
                        new HtmlElementTextContentLi(x.Render(renderContext, visualTree)) { Class = "nav-item" }
                    ).ToArray()
                )
                {
                    Class = HorizontalAlignment == TypeHorizontalAlignment.Right ? "" : "navbar-nav"
                }
            );

            return html;
        }
    }
}
