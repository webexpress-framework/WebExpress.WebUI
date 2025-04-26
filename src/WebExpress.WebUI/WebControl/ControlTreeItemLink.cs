using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a tree node with a link.
    /// </summary>
    public class ControlTreeItemLink : ControlTreeItem
    {
        /// <summary>
        /// Returns or sets the target uri.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Returns or sets the target.
        /// </summary>
        public TypeTarget Target { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="children">The children of the tree node.</param>
        public ControlTreeItemLink(string id = null, params ControlTreeItem[] children)
            : base(id, children)
        {
        }
    }
}
