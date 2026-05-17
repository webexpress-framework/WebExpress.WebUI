using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlPanelTool>()]
    public sealed class TestFragmentControlPanelTool : FragmentControlPanelTool
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlPanelTool(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Add(new ControlText() { Text = _ => "TestFragmentControlPanelTool" });
        }
    }
}
