using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a tab control that is part of the web UI.
    /// </summary>
    public interface IControlTab : IControl
    {
        /// <summary>
        /// Returns the pages of the tab.
        /// </summary>
        IEnumerable<IControlTabView> Views { get; }

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
    }
}
