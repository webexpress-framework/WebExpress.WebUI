using WebExpress.WebCore.WebFragment;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Contract for an entry that can be contributed as a fragment into a dropdown menu, so plugins
    /// can add their own items to an existing dropdown.
    /// </summary>
    /// <remarks>This interface defines the contract for dropdown items that can be used within a fragment
    /// control. Implementations of this interface may provide specific functionality or behavior for dropdown
    /// actions.</remarks>
    public interface IFragmentControlDropdownItem : IFragmentBase
    {
    }
}
