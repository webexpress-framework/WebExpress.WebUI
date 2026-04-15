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
        /// Gets the items in the dropdown.
        /// </summary>
        public IEnumerable<ControlFormItemInputComboItem> Items { get; }

        /// <summary>
        /// Gets the color. 
        /// </summary>
        public PropertyColorText Color { get; }

        /// <summary>
        /// Gets the size.
        /// </summary>
        public TypeSizeButton Size { get; }

        /// <summary>
        /// Gets the outline property.
        /// </summary>
        public bool Outline { get; }

        /// <summary>
        /// Gets whether the button should take up the full width.
        /// </summary>
        public TypeBlockButton Block { get; }

        /// <summary>
        /// Gets an indicator that indicates that a menu is present.
        /// </summary>
        public TypeToggleDropdown Toggle { get; }

        /// <summary>
        /// Gets the label.
        /// </summary>
        public string Text { get; }

        /// <summary>
        /// Gets the tooltip.
        /// </summary>
        public string Tooltip { get; }

        /// <summary>
        /// Gets the icon.
        /// </summary>
        public IIcon Icon { get; }

        /// <summary>
        /// Gets the activation status of the button.
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
