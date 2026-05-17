using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlModalForm>()]
    public sealed class TestFragmentControlModalForm : FragmentControlModalForm
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlModalForm(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Add(new ControlText() { Text = _ => "FragmentControlModalForm" });
        }
    }
}
