using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form item input selection control.
    /// Provides methods to manage selection options.
    /// </summary>
    public interface IControlFormItemInputSelection : IControlFormItemInput<ControlFormInputValueString>
    {
        /// <summary>
        /// Returns the entries.
        /// </summary>
        public IEnumerable<IControlFormItemInputSelectionItem> Options { get; }

        /// <summary>
        /// Returns or sets the label of the selected options.
        /// </summary>
        public string Placeholder { get; }

        /// <summary>
        /// Allows you to select multiple items.
        /// </summary>
        public bool MultiSelect { get; }

        /// <summary>
        /// Gets a value indicating whether sticky selection mode is enabled.
        /// When enabled and a value has been selected, the selection cannot be
        /// cleared through the user interface.
        /// </summary>
        public bool StickySelection { get; }

        /// <summary>
        /// Adds one or more items to the selection options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputSelection Add(params IControlFormItemInputSelectionItem[] items);

        /// <summary>
        /// Adds one or more items to the selection options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputSelection Add(IEnumerable<IControlFormItemInputSelectionItem> items);

        /// <summary>
        /// Removes an item from the selection options.
        /// </summary>
        /// <param name="item">The item to remove from the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputSelection Remove(IControlFormItemInputSelectionItem item);
    }
}
