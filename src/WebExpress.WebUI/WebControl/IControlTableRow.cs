using System.Collections.Generic;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a row in a control table, containing a collection of cells and a unique identifier.
    /// </summary>
    public interface IControlTableRow : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Returns the color scheme used for the row.
        /// </summary>
        TypeTableColor Color { get; }

        /// <summary>
        /// Returns the cells.
        /// </summary>
        IEnumerable<IControlTableCell> Cells { get; }

        /// <summary>
        /// Returns the options.
        /// </summary>
        IEnumerable<IControlDropdownItem> Options { get; }

        /// <summary>
        /// Adds the specified cells to the row.
        /// </summary>
        /// <param name="cells">The cells to be added to the row.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTableRow Add(params IControlTableCell[] cells);

        /// <summary>
        /// Adds the specified cells to the row.
        /// </summary>
        /// <param name="cells">The cells to be added to the row.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTableRow Add(IEnumerable<IControlTableCell> cells);

        /// <summary>
        /// Adds one or more items to the options.
        /// </summary>
        /// <param name="items">The items to add to the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTableRow Add(params IControlDropdownItem[] items);

        /// <summary>
        /// Adds one or more items to the options.
        /// </summary>
        /// <param name="items">The items to add to the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTableRow Add(IEnumerable<IControlDropdownItem> items);

        /// <summary>
        /// Adds a new separator.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        IControlTableRow AddSeperator();

        /// <summary>
        /// Adds a new head.
        /// </summary>
        /// <param name="text">The headline text.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTableRow AddHeader(string text);

        /// <summary>
        /// Removes the specified cell from the row.
        /// </summary>
        /// <param name="cell">The cell to be removed from the row.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTableRow Remove(IControlTableCell cell);

        /// <summary>
        /// Removes the specified item from the options.
        /// </summary>
        /// <param name="item">The item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTableRow Remove(IControlDropdownItem item);
    }
}
