using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlNavigation>()]
    public sealed class TestFragmentControlNavigation : FragmentControlNavigationItemLink
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlNavigation(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Text = "TestFragmentControlNavigation";
        }
    }
}
