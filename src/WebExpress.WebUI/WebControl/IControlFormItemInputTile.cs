using System;
using System.Collections.Generic;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a tile control that is part of the web UI.
    /// </summary>
    public interface IControlFormItemInputTile : IControlFormItemInput<ControlFormInputValueStringList>
    {
        /// <summary>
        /// Gets the items of the tile control.
        /// </summary>
        IEnumerable<IControlTileCard> Items { get; }

        /// <summary>
        /// Gets a value indicating whether multiple items can be selected simultaneously.
        /// </summary>
        Func<IRenderControlContext, bool> MultiSelect { get; }

        /// <summary>
        /// Gets a value indicating whether a search box is shown above the tiles.
        /// </summary>
        Func<IRenderControlContext, bool> Searchable { get; }

        /// <summary>
        /// Gets the placeholder of the search box.
        /// </summary>
        Func<IRenderControlContext, string> SearchPlaceholder { get; }

        /// <summary>
        /// Gets the number of tiles per row. A value of zero lets the tiles flow.
        /// </summary>
        Func<IRenderControlContext, int> Columns { get; }

        /// <summary>
        /// Gets the name of the input the visible tiles are filtered by.
        /// </summary>
        Func<IRenderControlContext, string> FilterSource { get; }

        /// <summary>
        /// Gets the text shown when no tile is left to choose from.
        /// </summary>
        Func<IRenderControlContext, string> EmptyText { get; }

        /// <summary>
        /// Adds one or more items to the tile control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputTile Add(params IControlTileCard[] items);

        /// <summary>
        /// Adds one or more items to the tile control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputTile Add(IEnumerable<IControlTileCard> items);

        /// <summary>
        /// Removes the specified control from the tile control.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputTile Remove(IControlTileCard item);
    }
}
