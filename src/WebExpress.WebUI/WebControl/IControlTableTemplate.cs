using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Contract for a template that defines how a table's rows and cells are rendered.
    /// </summary>
    public interface IControlTableTemplate : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
    }
}
