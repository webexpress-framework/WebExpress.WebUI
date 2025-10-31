using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlPanelFlex>()]
    public sealed class TestFragmentControlPanelFlex : FragmentControlPanelFlex
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlPanelFlex(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
        }
    }
}
