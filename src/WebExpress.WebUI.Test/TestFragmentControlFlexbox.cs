using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlFlex>()]
    public sealed class TestFragmentControlFlex : FragmentControlFlex
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlFlex(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
        }
    }
}
