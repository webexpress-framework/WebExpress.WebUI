using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form item input selection control.
    /// Provides methods to manage selection options.
    /// </summary>
    public interface IControlFormItemInputSelection : IControlFormItemInput
    {
        /// <summary>
        /// Returns the entries.
        /// </summary>
        public IEnumerable<ControlFormItemInputSelectionItem> Options { get; }

        /// <summary>
        /// Returns or sets the label of the selected options.
        /// </summary>
        public string Placeholder { get; set; }

        /// <summary>
        /// Allows you to select multiple items.
        /// </summary>
        public bool MultiSelect { get; set; }

        /// <summary>
        /// Adds one or more items to the selection options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputSelection Add(params ControlFormItemInputSelectionItem[] items);

        /// <summary>
        /// Removes an item from the selection options.
        /// </summary>
        /// <param name="item">The item to remove from the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputSelection Remove(ControlFormItemInputSelectionItem item);
    }
}
