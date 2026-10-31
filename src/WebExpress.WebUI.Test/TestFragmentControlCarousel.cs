using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlCarousel>()]
    public sealed class TestFragmentControlCarousel : FragmentControlCarousel
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlCarousel(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
        }
    }
}
