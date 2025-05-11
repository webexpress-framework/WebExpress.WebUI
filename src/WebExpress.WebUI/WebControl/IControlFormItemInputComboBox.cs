using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a combobox control within a form, providing methods to manage its items.
    /// </summary>
    public interface IControlFormItemInputComboBox : IControlFormItemInput
    {
        /// <summary>
        /// Returns the collection of items in the combobox.
        /// </summary>
        IEnumerable<ControlFormItemInputComboBoxItem> Items { get; }

        /// <summary>
        /// Adds one or more items to the combobox.
        /// </summary>
        /// <param name="items">The items to add to the combobox.</param>
        /// <returns>The current instance of the combobox for method chaining.</returns>
        IControlFormItemInputComboBox Add(params ControlFormItemInputComboBoxItem[] items);

        /// <summary>
        /// Removes a specific item from the combobox.
        /// </summary>
        /// <param name="item">The item to remove from the combobox.</param>
        /// <returns>The current instance of the combobox for method chaining.</returns>
        IControlFormItemInputComboBox Remove(ControlFormItemInputComboBoxItem item);
    }
}
