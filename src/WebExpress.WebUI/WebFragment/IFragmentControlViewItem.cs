using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Represents a view item within a fragment control, providing the contract for UI elements that
    /// are part of a fragment-based interface.
    /// </summary>
    public interface IFragmentControlViewItem : IFragmentWebUIElement<IRenderControlContext, IVisualTreeControl>, IFragmentBase
    {
    }
}
