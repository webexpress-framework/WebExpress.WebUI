using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlToolbarItemLabel>()]
    public sealed class TestFragmentControlToolbarItemLabel : FragmentControlToolbarItemLabel
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlToolbarItemLabel(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Text = "TestFragmentControlToolbarItemLabel";
        }
    }
}
