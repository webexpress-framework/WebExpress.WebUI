using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlMasterDetail>()]
    public sealed class TestFragmentControlMasterDetail : FragmentControlMasterDetail
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlMasterDetail(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            EmptyState = new ControlEmptyState() { Title = _ => "TestFragmentControlMasterDetail" };

            AddMaster(new ControlList(null, new ControlListItem()) { Selectable = _ => true });
        }
    }
}
