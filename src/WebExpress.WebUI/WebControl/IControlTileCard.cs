using System;
using System.Collections.Generic;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Contract for a card-style tile.
    /// </summary>
    public interface IControlTileCard : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the header text.
        /// </summary>
        Func<IRenderControlContext, string> Header { get; }

        /// <summary>
        /// Gets the color scheme used for the tile card.
        /// </summary>
        Func<IRenderControlContext, PropertyColorTile> Color { get; }

        /// <summary>
        /// Gets the kicker text shown above the header, typically the kind or
        /// category the card belongs to.
        /// </summary>
        Func<IRenderControlContext, string> Badge { get; }

        /// <summary>
        /// Gets the accent colour of the kicker.
        /// </summary>
        Func<IRenderControlContext, PropertyColorTile> BadgeColor { get; }

        /// <summary>
        /// Gets the chip shown at the trailing end of the kicker row, typically a
        /// short qualifier such as "popular".
        /// </summary>
        Func<IRenderControlContext, string> Chip { get; }

        /// <summary>
        /// Gets the value the card is filtered by when the tile control it belongs
        /// to is bound to another input.
        /// </summary>
        Func<IRenderControlContext, string> FilterValue { get; }

        /// <summary>
        /// Gets a value indicating whether the card stays visible no matter what the
        /// search box or the bound filter would otherwise hide.
        /// </summary>
        Func<IRenderControlContext, bool> AlwaysVisible { get; }

        /// <summary>
        /// Gets the values the card projects when it is selected, keyed by target name.
        /// </summary>
        Func<IRenderControlContext, IDictionary<string, string>> Bindings { get; }

        /// <summary>
        /// Gets the content of the tile card.
        /// </summary>
        IEnumerable<IControl> Content { get; }

        /// <summary>
        /// Gets the content of the footer of the tile card.
        /// </summary>
        IEnumerable<IControl> Footer { get; }

        /// <summary>
        /// Gets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        Func<IRenderControlContext, IAction> PrimaryAction { get; }

        /// <summary>
        /// Gets the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        Func<IRenderControlContext, IAction> SecondaryAction { get; }

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
        /// Adds one or more items to the footer of the tile card.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTileCard AddFooter(params IControl[] items);

        /// <summary>
        /// Adds one or more items to the footer of the tile card.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTileCard AddFooter(IEnumerable<IControl> items);

        /// <summary>
        /// Removes the specified control from the tile card.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTileCard Remove(IControl item);
    }
}
