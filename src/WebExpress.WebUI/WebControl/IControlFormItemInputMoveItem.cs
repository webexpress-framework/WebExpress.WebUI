using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an item in a move input form.
    /// </summary>
    public interface IControlFormItemInputMoveItem : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the text of the selection item.
        /// </summary>
        string Text { get; set; }

        /// <summary>
        /// Gets the icon associated with the selection item.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        IUri Image { get; set; }
    }
}
