using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that manages a tree structure of items.
    /// </summary>
    public interface IControlTree : IControl
    {
        /// <summary>
        /// Adds the specified tree items to the control.
        /// </summary>
        /// <param name="items">The tree items to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTree Add(params ControlTreeItem[] items);

        /// <summary>
        /// Adds the specified tree items to the control.
        /// </summary>
        /// <param name="items">The tree items to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTree Add(IEnumerable<ControlTreeItem> items);

        /// <summary>
        /// Removes the specified tree item from the control.
        /// </summary>
        /// <param name="item">The tree item to be removed.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTree Remove(ControlTreeItem item);
    }
}
