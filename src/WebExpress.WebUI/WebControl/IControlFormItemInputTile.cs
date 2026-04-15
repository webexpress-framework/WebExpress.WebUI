using System.Collections.Generic;

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
        bool MultiSelect { get; }

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
