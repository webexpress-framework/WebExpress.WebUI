using WebExpress.WebCore.WebFragment;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Contract for an entry that can be contributed as a fragment into a toolbar, so plugins can
    /// add their own items to an existing toolbar.
    /// </summary>
    /// <remarks>This interface defines the contract for toolbar items that can be used within a fragment
    /// control. Implementations of this interface may provide specific functionality or behavior for toolbar
    /// actions.</remarks>
    public interface IFragmentControlToolbarItem : IFragmentBase
    {
    }
}
