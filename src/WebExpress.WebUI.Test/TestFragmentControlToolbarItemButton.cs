using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlToolbarItemButton>()]
    public sealed class TestFragmentControlToolbarItemButton : FragmentControlToolbarItemButton
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlToolbarItemButton(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Text = "TestFragmentControlToolbarItemButton";
        }
    }
}
