using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlTool>()]
    public sealed class TestFragmentControlTool : FragmentControlTool
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlTool(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Add(new ControlText() { Text = _ => "TestFragmentControlTool" });
        }
    }
}
