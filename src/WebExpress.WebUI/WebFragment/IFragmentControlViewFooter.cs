using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Represents a view footer within a fragment control, providing the contract for UI elements that
    /// are part of a fragment-based interface.
    /// </summary>
    public interface IFragmentControlViewFooter : IFragmentWebUIElement<IRenderControlContext, IVisualTreeControl>, IFragmentBase
    {
    }
}
