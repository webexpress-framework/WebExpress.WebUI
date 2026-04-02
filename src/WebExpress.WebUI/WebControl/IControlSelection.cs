using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a read only selection control.
    /// </summary>
    public interface IControlSelection : IControl
    {
        /// <summary>
        /// Returns the text.
        /// </summary>
        string Value { get; }

        /// <summary>
        /// Adds one or more items to the selection options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSelection Add(params IControlFormItemInputSelectionItem[] items);

        /// <summary>
        /// Adds one or more items to the selection options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSelection Add(IEnumerable<IControlFormItemInputSelectionItem> items);

        /// <summary>
        /// Removes an item from the selection options.
        /// </summary>
        /// <param name="item">The item to remove from the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSelection Remove(IControlFormItemInputSelectionItem item);
    }
}
