using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a toolbar item dropdown control.
    /// </summary>
    public interface IControlToolbarItemDropdown : IControlToolbarItem
    {
        /// <summary>
        /// Returns the items in the dropdown.
        /// </summary>
        IEnumerable<IControlDropdownItem> Items { get; }

        /// <summary>
        /// Returns or sets the color. 
        /// </summary>
        PropertyColorText Color { get; }

        /// <summary>
        /// Returnsthe size.
        /// </summary>
        TypeSizeButton Size { get; }

        /// <summary>
        /// Returns the outline property.
        /// </summary>
        bool Outline { get; }

        /// <summary>
        /// Returns whether the button should take up the full width.
        /// </summary>
        TypeBlockButton Block { get; }

        /// <summary>
        /// Returns an indicator that indicates that a menu is present.
        /// </summary>
        TypeToggleDropdown Toggle { get; }

        /// <summary>
        /// Returns the label.
        /// </summary>
        string Label { get; }

        /// <summary>
        /// Returns the tooltip.
        /// </summary>
        string Tooltip { get; }

        /// <summary>
        /// Returns the icon.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Returns the activation status of the button.
        /// </summary>
        TypeActive Active { get; }

        /// <summary>
        /// Returns the orientation of the menu.
        /// </summary>
        TypeAlignmentDropdownMenu AlignmentMenu { get; }

        /// <summary>
        /// Returns the alignment of the toolbar item.
        /// </summary>
        TypeToolbarItemAlignment Alignment { get; }

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
        IControlToolbarItemDropdown Add(params IControlDropdownItem[] items);

        /// <summary>
        /// Adds one or more items to the dropdown.
        /// </summary>
        /// <param name="items">The items to add to the dropdown.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbarItemDropdown Add(IEnumerable<IControlDropdownItem> items);

        /// <summary>
        /// Adds a new separator.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbarItemDropdown AddSeperator();

        /// <summary>
        /// Adds a new head.
        /// </summary>
        /// <param name="text">The headline text.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbarItemDropdown AddHeader(string text);

        /// <summary>
        /// Removes the specified item from the dropdown control.
        /// </summary>
        /// <param name="item">The dropdown item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbarItemDropdown Remove(IControlDropdownItem item);
    }
}
