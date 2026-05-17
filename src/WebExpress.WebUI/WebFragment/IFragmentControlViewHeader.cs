using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Represents a view headers within a fragment control, providing the contract for UI elements that
    /// are part of a fragment-based interface.
    /// </summary>
    public interface IFragmentControlViewHeader : IFragmentWebUIElement<IRenderControlContext, IVisualTreeControl>, IFragmentBase
    {
    }
}
