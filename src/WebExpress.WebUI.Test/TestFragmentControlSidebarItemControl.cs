using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlSidebarItemControl>()]
    public sealed class TestFragmentControlSidebarItemControl : FragmentControlSidebarItemControl
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlSidebarItemControl(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Content = new ControlText() { Text = "TestFragmentControlSidebarItemControl" };
        }
    }
}
