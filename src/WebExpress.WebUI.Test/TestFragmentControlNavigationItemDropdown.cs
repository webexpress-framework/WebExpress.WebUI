using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlNavigationItemDropdown>()]
    public sealed class TestFragmentControlNavigationItemDropdown : FragmentControlNavigationItemLink
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlNavigationItemDropdown(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Text = "TestFragmentControlNavigationItemDropdown";
        }
    }
}
