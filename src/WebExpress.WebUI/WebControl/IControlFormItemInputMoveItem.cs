using System;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Contract for a single entry in a move/transfer form input.
    /// </summary>
    public interface IControlFormItemInputMoveItem : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the text of the selection item.
        /// </summary>
        Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets the icon associated with the selection item.
        /// </summary>
        Func<IRenderControlContext, IIcon> Icon { get; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        Func<IRenderControlContext, IUri> Image { get; set; }
    }
}
