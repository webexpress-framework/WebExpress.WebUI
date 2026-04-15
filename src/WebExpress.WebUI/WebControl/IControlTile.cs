using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a tile control that is part of the web UI.
    /// </summary>
    public interface IControlTile : IControl
    {
        /// <summary>
        /// Gets the items of the tile control.
        /// </summary>
        IEnumerable<IControlTileCard> Items { get; }

        /// <summary>
        /// Gets a value indicating whether cards in the tile can be moved.
        /// </summary>
        bool Movable { get; }

        /// <summary>
        /// Gets a value indicating whether items can be removed.
        /// </summary>
        bool AllowRemove { get; }

        /// <summary>
        /// Adds one or more items to the tile control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTile Add(params IControlTileCard[] items);

        /// <summary>
        /// Adds one or more items to the tile control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTile Add(IEnumerable<IControlTileCard> items);

        /// <summary>
        /// Removes the specified control from the tile control.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTile Remove(IControlTileCard item);
    }
}
