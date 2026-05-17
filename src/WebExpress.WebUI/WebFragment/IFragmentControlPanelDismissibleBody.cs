using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Represents a body fragment of a <c>ControlPanelDismissible</c>, providing
    /// the contract for fragments that contribute UI elements to the panel body.
    /// </summary>
    public interface IFragmentControlPanelDismissibleBody : IFragmentWebUIElement<IRenderControlContext, IVisualTreeControl>, IFragmentBase
    {
    }
}
