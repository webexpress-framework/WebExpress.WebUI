using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that manages a list of file items.
    /// </summary>
    public interface IControlFileList : IControl
    {
        /// <summary>
        /// Returns the collection of tree nodes.
        /// </summary>
        IEnumerable<IControlFileListItem> Files { get; }

        /// <summary>
        /// Adds the specified items to the control file list.
        /// </summary>
        /// <param name="items">An array to add to the list.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFileList Add(params IControlFileListItem[] items);

        /// <summary>
        /// Adds the specified items to the control file list.
        /// </summary>
        /// <param name="items">An array to add to the list.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFileList Add(IEnumerable<IControlFileListItem> items);

        /// <summary>
        /// Removes the specified file item from the control.
        /// </summary>
        /// <param name="item">The file item to be removed.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFileList Remove(IControlFileListItem item);
    }
}
