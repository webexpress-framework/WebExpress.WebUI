using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlSplitButtonItemLink>()]
    public sealed class TestFragmentControlSplitButtonItemLink : FragmentControlSplitButtonItemLink
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlSplitButtonItemLink(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Text = _ => "TestFragmentControlSplitButtonItemLink";
        }
    }
}
