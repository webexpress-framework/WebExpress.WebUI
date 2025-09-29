using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a dropdown control that provides methods to add items, separators, and headers.
    /// </summary>
    public interface IControlDropdown : IControl
    {
        /// <summary>
        /// Adds one or more items to the dropdown.
        /// </summary>
        /// <param name="items">The items to add to the dropdown.</param>
        /// <remarks>
        /// This method allows adding one or multiple dropdown items to the 
        /// items collection of the dropdown control. It is useful for dynamically 
        /// constructing the dropdown menu by appending various items to it.
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
        IControlDropdown Add(params IControlDropdownItem[] items);

        /// <summary>
        /// Adds one or more items to the dropdown.
        /// </summary>
        /// <param name="items">The items to add to the dropdown.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlDropdown Add(IEnumerable<IControlDropdownItem> items);

        /// <summary>
        /// Adds a new separator to the dropdown.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        /// <remarks>
        /// A separator is a visual divider used to group dropdown items.
        /// </remarks>
        IControlDropdown AddSeperator();

        /// <summary>
        /// Adds a new header to the dropdown.
        /// </summary>
        /// <param name="text">The headline text to display in the header.</param>
        /// <returns>The current instance for method chaining.</returns>
        /// <remarks>
        /// A header is a non-selectable item used to label or group dropdown items.
        /// </remarks>
        IControlDropdown AddHeader(string text);

        /// <summary>
        /// Removes the specified item from the dropdown control.
        /// </summary>
        /// <param name="item">The dropdown item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlDropdown Remove(IControlDropdownItem item);
    }
}
