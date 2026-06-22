using WebExpress.WebCore.WebFragment;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Contract for an entry that can be contributed as a fragment into a sidebar, so plugins can
    /// add their own items to an existing sidebar.
    /// </summary>
    /// <remarks>This interface defines the contract for sidebar items that can be used within a fragment
    /// control. Implementations of this interface may provide specific functionality or behavior for sidebar
    /// actions.</remarks>
    public interface IFragmentControlSidebarItem : IFragmentBase
    {
    }
}
