using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a view control that is part of the web UI.
    /// </summary>
    public interface IControlView : IControl
    {
        /// <summary>
        /// Gets the collection of headers that define the structure 
        /// and metadata of the control view.
        /// </summary>
        IEnumerable<IControlViewHeader> Headers { get; }

        /// <summary>
        /// Gets the views of the control.
        /// </summary>
        IEnumerable<IControlViewItem> Views { get; }

        /// <summary>
        /// Gets the collection of footers associated with the 
        /// control view.
        /// </summary>
        IEnumerable<IControlViewFooter> Footers { get; }

        /// <summary>
        /// Adds one or more headers to the view control.
        /// </summary>
        /// <param name="headers">The headers to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlView Add(params IControlViewHeader[] headers);

        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlView Add(params IControlViewItem[] items);

        /// <summary>
        /// Adds one or more fotters to the view control.
        /// </summary>
        /// <param name="footers">The footer to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlView Add(params IControlViewFooter[] footers);

        /// <summary>
        /// Adds one or more headers to the view control.
        /// </summary>
        /// <param name="headers">The headers to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlView Add(IEnumerable<IControlViewHeader> headers);

        /// <summary>
        /// Adds one or more items to the view control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlView Add(IEnumerable<IControlViewItem> items);

        /// <summary>
        /// Adds one or more footers to the view control.
        /// </summary>
        /// <param name="footers">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlView Add(IEnumerable<IControlViewFooter> footers);

        /// <summary>
        /// Removes the specified control from the view control.
        /// </summary>
        /// <param name="header">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlView Remove(IControlViewHeader header);

        /// <summary>
        /// Removes the specified control from the view control.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlView Remove(IControlViewItem item);

        /// <summary>
        /// Removes the specified control from the view control.
        /// </summary>
        /// <param name="footer">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlView Remove(IControlViewFooter footer);
    }
}
