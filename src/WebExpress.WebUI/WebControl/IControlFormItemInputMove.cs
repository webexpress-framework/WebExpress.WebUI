using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control for managing a move input form item.
    /// </summary>
    public interface IControlFormItemInputMove : IControlFormItemInput<ControlFormInputValueStringList>
    {
        /// <summary>
        /// Returns the collection of available options for the control.
        /// </summary>
        IEnumerable<ControlFormItemInputMoveItem> Options { get; }

        /// <summary>
        /// Returns or sets the label displayed for the selected options list.
        /// </summary>
        string SelectedHeader { get; }

        /// <summary>
        /// Returns or sets the label displayed for the available options list.
        /// </summary>
        string AvailableHeader { get; }

        /// <summary>
        /// Adds one or more items to the available options list.
        /// </summary>
        /// <param name="items">The items to add to the available options list.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputMove Add(params ControlFormItemInputMoveItem[] items);

        /// <summary>
        /// Removes a specific item from the available options list.
        /// </summary>
        /// <param name="item">The item to remove from the available options list.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputMove Remove(ControlFormItemInputMoveItem item);
    }
}
