using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment-based <see cref="FragmentControlPanelDismissible"/> used
    /// in unit tests to verify that the fragment composition pattern (panel +
    /// body sections) works end-to-end.
    /// </summary>
    [Section<TestSectionFragmentControlPanelDismissibleBody>()]
    public sealed class TestFragmentControlPanelDismissible : FragmentControlPanelDismissible
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="fragmentContext">The context of the fragment.</param>
        public TestFragmentControlPanelDismissible(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Title = _ => "FragmentPanel";
            Add(new ControlText() { Text = _ => "fragment-content" });
        }
    }
}
