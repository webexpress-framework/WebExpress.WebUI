using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a list control that can manage a collection of list items.
    /// </summary>
    public interface IControlList : IControl
    {
        /// <summary>
        /// Gets or sets a value indicating whether list rows are selectable. When
        /// enabled the active row is highlighted with a primary-color left
        /// accent and the first row is auto-selected on initialization.
        /// </summary>
        bool Selectable { get; set; }

        /// <summary>
        /// Adds a collection of list entries to the existing items.
        /// </summary>
        /// <param name="items">The list entries to add.</param>
        /// <remarks>
        /// This method appends the specified collection of <see cref="ControlListItem"/> instances to the 
        /// current list of items. It ensures that the new items are concatenated with the existing ones, 
        /// maintaining the order of addition.
        /// 
        /// Example usage:
        /// <code>
        /// var list = new ControlList();
        /// var item1 = new ControlListItem { Text = "Item 1" };
        /// var item2 = new ControlListItem { Text = "Item 2" };
        /// list.Add(item1, item2);
        /// </code>
        /// 
        /// This method accepts any item that derives from <see cref="ControlListItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlList Add(params ControlListItem[] items);

        /// <summary>
        /// Adds a collection of list entries to the existing items.
        /// </summary>
        /// <param name="items">The list entries to add.</param>
        /// <remarks>
        /// This method appends the specified collection of <see cref="ControlListItem"/> instances to the 
        /// current list of items. It ensures that the new items are concatenated with the existing ones, 
        /// maintaining the order of addition.
        /// 
        /// Example usage:
        /// <code>
        /// var list = new ControlList();
        /// var item1 = new ControlListItem { Text = "Item 1" };
        /// var item2 = new ControlListItem { Text = "Item 2" };
        /// list.Add(item1, item2);
        /// </code>
        /// 
        /// This method accepts any item that derives from <see cref="ControlListItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlList Add(IEnumerable<ControlListItem> items);

        /// <summary>
        /// Removes a specified list entry from the existing items.
        /// </summary>
        /// <param name="item">The list entry to remove.</param>
        /// <remarks>
        /// This method removes the specified <see cref="ControlListItem"/> instance from the 
        /// current list of items. If the item does not exist in the list, the method does nothing.
        /// 
        /// Example usage:
        /// <code>
        /// var list = new ControlList();
        /// var item1 = new ControlListItem { Text = "Item 1" };
        /// list.Add(item1);
        /// list.Remove(item1);
        /// </code>
        /// 
        /// This method accepts any item that derives from <see cref="ControlListItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlList Remove(ControlListItem item);
    }
}
