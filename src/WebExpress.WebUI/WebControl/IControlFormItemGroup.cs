using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a group of form items within a control.
    /// </summary>
    public interface IControlFormItemGroup : IControlFormItem
    {
        /// <summary>
        /// Adds a collection of form entries to the existing items.
        /// </summary>
        /// <param name="items">The form entries to add.</param>
        /// <remarks>
        /// This method appends the specified collection of <see cref="ControlFormItem"/> instances to the 
        /// current list of items. It ensures that the new items are concatenated with the existing ones, 
        /// maintaining the order of addition.
        /// This method accepts any item that derives from <see cref="ControlFormItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemGroup Add(params ControlFormItem[] items);

        /// <summary>
        /// Adds a collection of form entries to the existing items.
        /// </summary>
        /// <param name="items">The form entries to add.</param>
        /// <remarks>
        /// This method appends the specified collection of <see cref="ControlFormItem"/> instances to the 
        /// current form of items. It ensures that the new items are concatenated with the existing ones, 
        /// maintaining the order of addition.
        /// This method accepts any item that derives from <see cref="ControlFormItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemGroup Add(IEnumerable<ControlFormItem> items);

        /// <summary>
        /// Removes a specified form entry from the existing items.
        /// </summary>
        /// <param name="item">The form entry to remove.</param>
        /// <remarks>
        /// This method removes the specified <see cref="ControlFormItem"/> instance from the 
        /// current form of items. If the item does not exist in the list, the method does nothing.
        /// This method accepts any item that derives from <see cref="ControlFormItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemGroup Remove(ControlFormItem item);
    }
}
