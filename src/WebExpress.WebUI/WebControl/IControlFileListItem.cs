using System;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an item in a file list control.
    /// </summary>
    public interface IControlFileListItem : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the icon associated with this file.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        IUri Image { get; set; }

        /// <summary>
        /// Gets the name of the file, including its extension.
        /// </summary>
        string Name { get; }

        /// <summary>
        /// Gets the uri of the file.
        /// </summary>
        IUri Uri { get; }

        /// <summary>
        /// Gets the size of the file in bytes.
        /// </summary>
        long Size { get; }

        /// <summary>
        /// Gets the date of the file.
        /// </summary>
        DateTime Date { get; }

        /// <summary>
        /// Gets the description associated with the file.
        /// </summary>
        string Description { get; }
    }
}
