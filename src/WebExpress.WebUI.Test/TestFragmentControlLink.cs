using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlLink>()]
    public sealed class TestFragmentControlLink : FragmentControlLink
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlLink(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Text = _ => "TestFragmentControlLink";
        }
    }
}
