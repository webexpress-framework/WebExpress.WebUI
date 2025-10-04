using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlSidebarItemLink>()]
    public sealed class TestFragmentControlSidebarItemLink : FragmentControlSidebarItemLink
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlSidebarItemLink(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Text = "TestFragmentControlSidebarItemLink";
        }
    }
}
