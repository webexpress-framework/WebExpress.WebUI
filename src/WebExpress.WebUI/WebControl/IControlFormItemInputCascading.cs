using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form item input cascading control.
    /// Provides methods to manage cascading options.
    /// </summary>
    public interface IControlFormItemInputCascading : IControlFormItemInput<ControlFormInputValueStringList>
    {
        /// <summary>
        /// Returns the entries.
        /// </summary>
        public IEnumerable<IControlFormItemInputCascadingItem> Options { get; }

        /// <summary>
        /// Gets or sets the label of the cascading options.
        /// </summary>
        public string Placeholder { get; }

        /// <summary>
        /// Adds one or more items to the selection options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputCascading Add(params IControlFormItemInputCascadingItem[] items);

        /// <summary>
        /// Removes an item from the selection options.
        /// </summary>
        /// <param name="item">The item to remove from the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputCascading Remove(IControlFormItemInputCascadingItem item);
    }
}
