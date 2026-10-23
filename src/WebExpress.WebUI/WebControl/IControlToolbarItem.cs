using System;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Contract for an entry that can appear on a toolbar.
    /// </summary>
    public interface IControlToolbarItem : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the alignment of the toolbar item.
        /// </summary>
        Func<IRenderControlContext, TypeToolbarItemAlignment> Alignment { get; }

        /// <summary>
        /// Gets the overflow behavior of the toolbar item.
        /// </summary>
        Func<IRenderControlContext, TypeToolbarItemOverflow> Overflow { get; }
    }
}
