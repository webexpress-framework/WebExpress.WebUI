using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines a tab view for grouping form items within a control form.
    /// </summary>
    public interface IControlFormItemGroupTabView : IWebUIElement<IRenderControlContext, IVisualTreeControl>, IControlFormItemGroup
    {
        /// <summary>
        /// Returns the title text.
        /// </summary>
        string Title { get; }

        /// <summary>
        /// Returns the icon associated with this view.
        /// </summary>
        IIcon Icon { get; }
    }
}
