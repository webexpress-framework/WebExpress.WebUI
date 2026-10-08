using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Contract for a search box that can be contributed as a fragment into a search section, so a
    /// plugin can supply the box a page or an application header renders without the host knowing
    /// about it in advance.
    /// </summary>
    /// <remarks>
    /// The host collects its search boxes through this contract rather than through the concrete
    /// <see cref="FragmentControlSearch"/>, so a search box built on a richer control — a data bound
    /// one, for example — is picked up by the same slot.
    /// </remarks>
    public interface IFragmentControlSearch : IFragmentBase, IControl
    {
    }
}
