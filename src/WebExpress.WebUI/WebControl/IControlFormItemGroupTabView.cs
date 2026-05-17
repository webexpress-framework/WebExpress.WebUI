using System;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines a tab view for grouping form items within a control form.
    /// </summary>
    public interface IControlFormItemGroupTabView : IWebUIElement<IRenderControlFormContext, IVisualTreeControl>, IControlFormItemGroup
    {
        /// <summary>
        /// Gets the title text.
        /// </summary>
        Func<IRenderControlFormContext, string> Title { get; }

        /// <summary>
        /// Gets the icon associated with this view.
        /// </summary>
        Func<IRenderControlFormContext, IIcon> Icon { get; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        Func<IRenderControlFormContext, IUri> Image { get; set; }
    }
}
