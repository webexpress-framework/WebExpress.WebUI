using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a view control that is part of the web UI.
    /// </summary>
    public interface IControlView : IControl
    {
        /// <summary>
        /// Returns the views of the control.
        /// </summary>
        IEnumerable<IControlViewItem> Views { get; }

        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlView Add(params IControlViewItem[] items);

        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlView Add(IEnumerable<IControlViewItem> items);

        /// <summary>
        /// Removes the specified control from the view control.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlView Remove(IControlViewItem item);
    }
}
