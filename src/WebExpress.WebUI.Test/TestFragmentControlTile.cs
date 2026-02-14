using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlTile>()]
    public sealed class TestFragmentControlTile : FragmentControlTile
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlTile(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Add(new ControlTileCard());
        }
    }
}
