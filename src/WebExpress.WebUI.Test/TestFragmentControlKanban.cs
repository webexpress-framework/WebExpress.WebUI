using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlKanban>()]
    public sealed class TestFragmentControlKanban : FragmentControlKanban
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlKanban(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Add(new ControlKanbanCard());
        }
    }
}
