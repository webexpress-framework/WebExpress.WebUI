using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a view in a tab control.
    /// </summary>
    public interface IControlTabView : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the title text.
        /// </summary>
        string Title { get; }

        /// <summary>
        /// Gets the icon associated with this view.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Adds one or more items to the view.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTabView Add(params IControl[] items);

        /// <summary>
        /// Adds one or more items to the view.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTabView Add(IEnumerable<IControl> items);

        /// <summary>
        /// Removes the specified control from the view.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTabView Remove(IControl item);
    }
}
