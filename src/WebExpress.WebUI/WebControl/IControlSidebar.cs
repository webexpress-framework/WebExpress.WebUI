using System;
using System.Collections.Generic;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a responsive sidebar UI control that hosts customizable sidebar items.
    /// </summary>
    public interface IControlSidebar : IControl
    {
        /// <summary>
        /// Gets the list of sidebar items.
        /// </summary>
        /// <value>
        /// A list of <see cref="IControlToolbarItem"/> representing the items in the toolbar.
        /// </value>
        IEnumerable<IControlSidebarItem> Items { get; }

        /// <summary>
        /// Gets the collection of toolbar items associated with the control.
        /// </summary>
        IEnumerable<IControlToolbarItem> ToolbarItems { get; }

        /// <summary>
        /// Gets or sets whether hovering the collapsed rail reveals the full sidebar as an
        /// offcanvas flyout until the pointer leaves.
        /// </summary>
        Func<IRenderControlContext, bool> HoverExpanded { get; set; }

        /// <summary>
        /// Gets or sets whether the first active item is scrolled into view once the sidebar is
        /// built, expanding its ancestor groups so the current location stays visible.
        /// </summary>
        Func<IRenderControlContext, bool> ScrollActiveIntoView { get; set; }

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

        /// <summary>
        /// Adds one or more controls to the sidebar toolbar (footer).
        /// </summary>
        /// <param name="items">The toolbar items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSidebar Add(params IControlToolbarItem[] items);

        /// <summary>
        /// Adds one or more controls to the sidebar toolbar (footer).
        /// </summary>
        /// <param name="items">The toolbar items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSidebar Add(IEnumerable<IControlToolbarItem> items);

        /// <summary>
        /// Removes a control from the sidebar toolbar (footer).
        /// </summary>
        /// <param name="item">The toolbar item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSidebar Remove(IControlToolbarItem item);
    }
}
