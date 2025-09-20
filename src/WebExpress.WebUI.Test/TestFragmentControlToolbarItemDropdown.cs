using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlToolbarItemDropdown>()]
    public sealed class TestFragmentControlToolbarItemDropdown : FragmentControlToolbarItemDropdown
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlToolbarItemDropdown(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Label = "TestFragmentControlToolbarItemDropdown";
        }
    }
}
