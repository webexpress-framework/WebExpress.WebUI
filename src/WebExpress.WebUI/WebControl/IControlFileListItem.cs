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
        Func<IRenderControlContext, IIcon> Icon { get; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets the name of the file, including its extension.
        /// </summary>
        Func<IRenderControlContext, string> Name { get; }

        /// <summary>
        /// Gets the uri of the file.
        /// </summary>
        Func<IRenderControlContext, IUri> Uri { get; }

        /// <summary>
        /// Gets the size of the file in bytes.
        /// </summary>
        Func<IRenderControlContext, long> Size { get; }

        /// <summary>
        /// Gets the date of the file.
        /// </summary>
        Func<IRenderControlContext, DateTime> Date { get; }

        /// <summary>
        /// Gets the description associated with the file.
        /// </summary>
        Func<IRenderControlContext, string> Description { get; }
    }
}
