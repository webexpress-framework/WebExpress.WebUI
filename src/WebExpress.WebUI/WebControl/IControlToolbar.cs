using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a toolbar control that provides methods to manage toolbar items.
    /// </summary>
    public interface IControlToolbar : IControl
    {
        /// <summary>
        /// Returns the list of toolbar items.
        /// </summary>
        /// <value>
        /// A list of <see cref="IControlToolbarItem"/> representing the items in the toolbar.
        /// </value>
        IEnumerable<IControlToolbarItem> Items { get; }

        /// <summary>
        /// Returns a collection of additional dropdown items.
        /// </summary>
        IEnumerable<IControlDropdownItem> More { get; }

        /// <summary>
        /// Adds one or more toolbar items to the toolbar.
        /// </summary>
        /// <param name="items">The toolbar items to add.</param>
        /// <remarks>
        /// This method appends the specified collection of <see cref="IControlToolbarItem"/> instances to the 
        /// current toolbar. It ensures that the new items are concatenated with the existing ones, 
        /// maintaining the order of addition.
        /// 
        /// Example usage:
        /// <code>
        /// var tool = new ControlToolbar();
        /// var item1 = new ControlToolBarItemButton { Text = "Item 1" };
        /// var item2 = new ControlToolBarItemButton { Text = "Item 2" };
        /// tool.Add(item1, item2);
        /// </code>
        /// 
        /// This method accepts any item that derives from <see cref="IControlToolbarItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbar Add(params IControlToolbarItem[] items);

        /// <summary>
        /// Adds a collection of toolbar items to the toolbar.
        /// </summary>
        /// <param name="items">The collection of toolbar items to add.</param>
        /// <remarks>
        /// This method appends the specified collection of <see cref="IControlToolbarItem"/> instances to the 
        /// current toolbar. It ensures that the new items are concatenated with the existing ones, 
        /// maintaining the order of addition.
        /// 
        /// Example usage:
        /// <code>
        /// var tool = new ControlToolbar();
        /// var item1 = new ControlToolBarItemButton { Text = "Item 1" };
        /// var item2 = new ControlToolBarItemButton { Text = "Item 2" };
        /// tool.Add(new List<IControlToolbarItem> { item1, item2 });
        /// </code>
        /// 
        /// This method accepts any item that derives from <see cref="IControlToolbarItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbar Add(IEnumerable<IControlToolbarItem> items);

        /// <summary>
        /// Removes a toolbar item from the toolbar.
        /// </summary>
        /// <param name="item">The toolbar item to remove.</param>
        /// <remarks>
        /// This method removes the specified <see cref="IControlToolbarItem"/> instance from the 
        /// current toolbar. If the item does not exist in the toolbar, the method does nothing.
        /// 
        /// Example usage:
        /// <code>
        /// var tool = new ControlToolbar();
        /// var item = new ControlToolBarItemButton { Text = "Item 1" };
        /// tool.Add(item);
        /// tool.Remove(item);
        /// </code>
        /// 
        /// This method accepts any item that derives from <see cref="IControlToolbarItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbar Remove(IControlToolbarItem item);

        /// <summary>
        /// Adds one or more toolbar more items to the toolbar.
        /// </summary>
        /// <param name="items">The toolbar more items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbar AddMore(params IControlDropdownItem[] items);

        /// <summary>
        /// Adds one or more toolbar more items to the toolbar.
        /// </summary>
        /// <param name="items">The toolbar more items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbar AddMore(IEnumerable<IControlDropdownItem> items);

        /// <summary>
        /// Removes a toolbar more item from the toolbar.
        /// </summary>
        /// <param name="item">The toolbar more item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbar RemoveMore(IControlDropdownItem item);
    }
}
