using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlSidebarItemHeader>()]
    public sealed class TestFragmentControlSidebarItemHeader : FragmentControlSidebarItemHeader
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlSidebarItemHeader(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Text = "TestFragmentControlSidebarItemHeader";
        }
    }
}
