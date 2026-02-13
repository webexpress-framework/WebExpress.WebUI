using System.Collections.Generic;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a view item in a view control.
    /// </summary>
    public interface IControlViewItem : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Returns the title text.
        /// </summary>
        string Title { get; }

        /// <summary>
        /// Returns the description of the view.
        /// </summary>
        string Description { get; }

        /// <summary>
        /// Returns a value indicating whether the detail frame is enabled.
        /// </summary>
        bool DetailFrame { get; }

        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlViewItem Add(params IControl[] items);

        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlViewItem Add(IEnumerable<IControl> items);

        /// <summary>
        /// Removes the specified control from the view item.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlViewItem Remove(IControl item);
    }
}
