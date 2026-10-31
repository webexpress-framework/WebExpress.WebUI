using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlAccordion>()]
    public sealed class TestFragmentControlAccordion : FragmentControlAccordion
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlAccordion(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
        }
    }
}
