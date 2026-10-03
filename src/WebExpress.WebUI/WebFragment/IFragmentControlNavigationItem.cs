using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Contract for an entry that can be contributed as a fragment into a navigation bar, so plugins
    /// can add their own items to an existing navigation.
    /// </summary>
    /// <remarks>
    /// This interface defines the contract for navigation items that can be used within 
    /// a fragment control.
    /// </remarks>
    public interface IFragmentControlNavigationItem : IFragmentBase, IControlNavigationItem
    {
    }
}
