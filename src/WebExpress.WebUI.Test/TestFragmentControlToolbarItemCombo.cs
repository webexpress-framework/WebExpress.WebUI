using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlToolbarItemCombo>()]
    public sealed class TestFragmentControlToolbarItemCombo : FragmentControlToolbarItemCombo
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlToolbarItemCombo(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Label = "TestFragmentControlToolbarItemCombo";
        }
    }
}
