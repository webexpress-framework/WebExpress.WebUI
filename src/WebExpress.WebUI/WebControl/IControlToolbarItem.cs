using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Interface for a toolbar item control.
    /// </summary>
    public interface IControlToolbarItem : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the alignment of the toolbar item.
        /// </summary>
        TypeToolbarItemAlignment Alignment { get; }

        /// <summary>
        /// Gets the overflow behavior of the toolbar item.
        /// </summary>
        TypeToolbarItemOverflow Overflow { get; }
    }
}
