using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a group of form items organized as a tab within a control form layout.
    /// </summary>
    public interface IControlFormItemGroupTab : IControlFormItemGroup
    {
        /// <summary>
        /// Adds the specified view to the tab.
        /// </summary>
        /// <param name="views">The tab views to add. Cannot be null.</param>
        /// <returns>The current instance of the group, enabling method chaining.</returns>
        IControlFormItemGroupTab AddView(params IControlFormItemGroupTabView[] views);

        /// <summary>
        /// Adds the specified view to the tab.
        /// </summary>
        /// <param name="views">The tab views to add. Cannot be null.</param>
        /// <returns>The current instance of the group, enabling method chaining.</returns>
        IControlFormItemGroupTab AddView(IEnumerable<IControlFormItemGroupTabView> views);

        /// <summary>
        /// Removes the specified tab view from the group.
        /// </summary>
        /// <param name="view">The tab view to remove from the group. Cannot be null.</param>
        /// <returns>The current instance of the group tab after the specified view has been removed.</returns>
        IControlFormItemGroupTab RemoveView(IControlFormItemGroupTabView view);
    }
}
