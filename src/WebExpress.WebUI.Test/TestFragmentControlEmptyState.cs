using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlEmptyState>()]
    public sealed class TestFragmentControlEmptyState : FragmentControlEmptyState
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlEmptyState(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Title = _ => "TestFragmentControlEmptyState";
        }
    }
}
