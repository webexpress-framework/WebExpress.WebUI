using System.Collections.Generic;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a view footer in a view control.
    /// </summary>
    public interface IControlViewFooter : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlViewFooter Add(params IControl[] items);

        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlViewFooter Add(IEnumerable<IControl> items);

        /// <summary>
        /// Removes the specified control from the view item.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlViewFooter Remove(IControl item);
    }
}
