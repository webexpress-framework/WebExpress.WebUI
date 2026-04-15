using System.Collections.Generic;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an item in a control tree.
    /// </summary>
    public interface IControlTreeItem : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the label of the tree item.
        /// </summary>
        string Text { get; }

        /// <summary>
        /// Gets the child tree items.
        /// </summary>
        IEnumerable<IControlTreeItem> Children { get; }

        /// <summary>
        /// Adds the specified children to the tree node.
        /// </summary>
        /// <param name="children">The children to add.</param>
        /// <returns>The current instance, allowing for method chaining.</returns>
        IControlTreeItem Add(params IControlTreeItem[] children);

        /// <summary>
        /// Adds the specified children to the tree node.
        /// </summary>
        /// <param name="children">The children to add.</param>
        /// <returns>The current instance, allowing for method chaining.</returns>
        IControlTreeItem Add(IEnumerable<IControlTreeItem> children);

        /// <summary>
        /// Removes the specified content or child tree item from the tree item.
        /// </summary>
        /// <param name="child">The content or child tree item to remove.</param>
        /// <returns>The current instance, allowing for method chaining.</returns>
        IControlTreeItem Remove(IControlTreeItem child);
    }
}
