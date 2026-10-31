using System;
using System.Collections.Generic;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a tab control that is part of the web UI.
    /// </summary>
    public interface IControlTab : IControl
    {
        /// <summary>
        /// Gets the pages of the tab.
        /// </summary>
        IEnumerable<IControlTabView> Views { get; }

        /// <summary>
        /// Gets or sets the color of the active tab: the text of the underline layout or the
        /// fill of the pill layout.
        /// </summary>
        Func<IRenderControlContext, PropertyColorText> Color { get; set; }

        /// <summary>
        /// Gets or sets the color of the line under the active tab in the underline layout.
        /// When not set, the line takes the text color.
        /// </summary>
        Func<IRenderControlContext, PropertyColorBorder> UnderlineColor { get; set; }

        /// <summary>
        /// Gets or sets the layout.
        /// </summary>
        Func<IRenderControlContext, TypeLayoutTab> Layout { get; set; }

        /// <summary>
        /// Adds one or more pages to the tab.
        /// </summary>
        /// <param name="pages">The pages to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTab Add(params IControlTabView[] pages);

        /// <summary>
        /// Adds one or more pages to the tab.
        /// </summary>
        /// <param name="pages">The pages to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTab Add(IEnumerable<IControlTabView> pages);

        /// <summary>
        /// Removes the specified page from the tab.
        /// </summary>
        /// <param name="page">The page to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTab Remove(IControlTabView page);

        /// <summary>
        /// Returns the toolbar items of the tab.
        /// </summary>
        IEnumerable<IControlToolbarItem> ToolbarItems { get; }

        /// <summary>
        /// Adds one or more toolbar items to the tab.
        /// </summary>
        /// <param name="items">The toolbar items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTab Add(params IControlToolbarItem[] items);

        /// <summary>
        /// Adds one or more toolbar items to the tab.
        /// </summary>
        /// <param name="items">The toolbar items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTab Add(IEnumerable<IControlToolbarItem> items);

        /// <summary>
        /// Removes the specified toolbar item from the tab.
        /// </summary>
        /// <param name="item">The toolbar item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTab Remove(IControlToolbarItem item);
    }
}
