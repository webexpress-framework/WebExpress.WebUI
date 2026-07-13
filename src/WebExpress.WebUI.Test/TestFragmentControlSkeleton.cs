using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlSkeleton>()]
    public sealed class TestFragmentControlSkeleton : FragmentControlSkeleton
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlSkeleton(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
        }
    }
}
