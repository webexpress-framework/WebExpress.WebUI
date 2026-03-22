using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a quickfilter control that is part of the web UI.
    /// </summary>
    public interface IControlQuickfilter : IControl
    {
        /// <summary>
        /// Returns the items of the quickfilter control.
        /// </summary>
        IEnumerable<IControlQuickfilterItem> Items { get; }

        /// <summary>
        /// Adds one or more items to the quickfilter control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlQuickfilter Add(params IControlQuickfilterItem[] items);

        /// <summary>
        /// Adds one or more items to the quickfilter control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlQuickfilter Add(IEnumerable<IControlQuickfilterItem> items);

        /// <summary>
        /// Removes the specified control from the quickfilter control.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlQuickfilter Remove(IControlQuickfilterItem item);
    }
}
