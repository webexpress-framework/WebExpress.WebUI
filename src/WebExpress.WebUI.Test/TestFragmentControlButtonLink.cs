using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlButtonLink>()]
    public sealed class TestFragmentControlButtonLink : FragmentControlButtonLink
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlButtonLink(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Text = (c) => "TestFragmentControlButtonLink";
        }
    }
}
