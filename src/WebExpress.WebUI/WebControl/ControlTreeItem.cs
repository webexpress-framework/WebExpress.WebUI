using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a tree node for the <see cref="ControlTree"/>.
    /// </summary>
    public class ControlTreeItem
    {
        private readonly List<ControlTreeItem> _children = new();

        /// <summary>
        /// Returns the unique identifier of the tree item.
        /// </summary>
        public string Id { get; }

        /// <summary>
        /// Returns or sets the label of the tree item.
        /// </summary>
        public string Label { get; set; }

        /// <summary>
        /// Returns or sets the icon associated with the tree item.
        /// </summary>
        public IIcon Icon { get { return IconOpen; } set { IconOpen = IconClose = value; } }

        /// <summary>
        /// Returns or sets the icon associated with the tree item.
        /// </summary>
        public IIcon IconOpen { get; set; }

        /// <summary>
        /// Returns or sets the icon associated with the tree item.
        /// </summary>
        public IIcon IconClose { get; set; }

        /// <summary>
        /// Returns or sets a value indicating whether the tree item is expanded.
        /// </summary>
        public bool Expand { get; set; }

        /// <summary>
        /// Returns or sets a tooltip text.
        /// </summary>
        public string Tooltip { get; set; }

        /// <summary>
        /// Returns or sets a value indicating whether the tree item is active.
        /// </summary>
        public bool Active { get; set; }

        /// <summary>
        /// Returns the child tree items.
        /// </summary>
        public IEnumerable<ControlTreeItem> Children => _children;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The unique identifier of the tree node.</param>
        /// <param name="children">The children of the tree node.</param>
        public ControlTreeItem(string id = null, params ControlTreeItem[] children)
        {
            Id = id;
            _children.AddRange(children);
        }

        /// <summary>
        /// Adds the specified children to the tree node.
        /// </summary>
        /// <param name="children">The children to add.</param>
        public void Add(params ControlTreeItem[] children)
        {
            _children.AddRange(children);
        }

        /// <summary>
        /// Removes the specified content or child tree item from the tree item.
        /// </summary>
        /// <param name="child">The content or child tree item to remove.</param>
        public void Remove(ControlTreeItem child)
        {
            if (child is ControlTreeItem)
            {
                _children.Remove(child);
                return;
            }
        }
    }
}
