using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a responsive sidebar UI control that hosts customizable sidebar items.
    /// </summary>
    public interface IControlSidebar : IControl
    {
        /// <summary>
        /// Returns the list of sidebar items.
        /// </summary>
        /// <value>
        /// A list of <see cref="IControlToolbarItem"/> representing the items in the toolbar.
        /// </value>
        IEnumerable<IControlSidebarItem> Items { get; }

        /// <summary>
        /// Adds one or more sidebar items to the sidebar.
        /// </summary>
        /// <param name="items">The sidebar items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSidebar Add(params IControlSidebarItem[] items);

        /// <summary>
        /// Adds a collection of sidebar items to the sidebar.
        /// </summary>
        /// <param name="items">The collection of sidebar items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSidebar Add(IEnumerable<IControlSidebarItem> items);

        /// <summary>
        /// Removes a sidebar item from the sidebar.
        /// </summary>
        /// <param name="item">The sidebar item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSidebar Remove(IControlSidebarItem item);
    }
}
