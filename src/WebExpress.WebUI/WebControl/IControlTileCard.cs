using System.Collections.Generic;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a card in a tile control.
    /// </summary>
    public interface IControlTileCard : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the header text.
        /// </summary>
        string Header { get; }

        /// <summary>
        /// Gets the color scheme used for the tile card.
        /// </summary>
        PropertyColorTile Color { get; }

        /// <summary>
        /// Gets the content of the tile card.
        /// </summary>
        IEnumerable<IControl> Content { get; }

        /// <summary>
        /// Gets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        IAction PrimaryAction { get; }

        /// <summary>
        /// Gets the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        IAction SecondaryAction { get; }

        /// <summary>
        /// Adds one or more items to the tile card.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTileCard Add(params IControl[] items);

        /// <summary>
        /// Adds one or more items to the tile card.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTileCard Add(IEnumerable<IControl> items);

        /// <summary>
        /// Removes the specified control from the tile card.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTileCard Remove(IControl item);
    }
}
