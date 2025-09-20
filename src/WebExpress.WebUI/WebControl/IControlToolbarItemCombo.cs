using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a toolbar item combo control.
    /// </summary>
    public interface IControlToolbarItemCombo : IControlToolbarItem
    {
        /// <summary>
        /// Returns the items in the dropdown.
        /// </summary>
        public IEnumerable<ControlFormItemInputComboItem> Items { get; }

        /// <summary>
        /// Returns the color. 
        /// </summary>
        public PropertyColorText Color { get; }

        /// <summary>
        /// Returns the size.
        /// </summary>
        public TypeSizeButton Size { get; }

        /// <summary>
        /// Returns the outline property.
        /// </summary>
        public bool Outline { get; }

        /// <summary>
        /// Returns whether the button should take up the full width.
        /// </summary>
        public TypeBlockButton Block { get; }

        /// <summary>
        /// Returns an indicator that indicates that a menu is present.
        /// </summary>
        public TypeToggleDropdown Toggle { get; }

        /// <summary>
        /// Returns the label.
        /// </summary>
        public string Label { get; }

        /// <summary>
        /// Returns the tooltip.
        /// </summary>
        public string Tooltip { get; }

        /// <summary>
        /// Returns the icon.
        /// </summary>
        public IIcon Icon { get; }

        /// <summary>
        /// Returns the activation status of the button.
        /// </summary>
        public TypeActive Active { get; }

        /// <summary>
        /// Adds one or more items to the combo.
        /// </summary>
        /// <param name="items">The items to add to the combo.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbarItemCombo Add(params ControlFormItemInputComboItem[] items);

        /// <summary>
        /// Adds one or more items to the combo.
        /// </summary>
        /// <param name="items">The items to add to the combo.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbarItemCombo Add(IEnumerable<ControlFormItemInputComboItem> items);

        /// <summary>
        /// Removes the specified item from the combo control.
        /// </summary>
        /// <param name="item">The combo item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbarItemCombo Remove(ControlFormItemInputComboItem item);
    }
}
