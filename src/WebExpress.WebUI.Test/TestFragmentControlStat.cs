using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlStat>()]
    public sealed class TestFragmentControlStat : FragmentControlStat
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlStat(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Label = _ => "TestFragmentControlStat";
            Value = _ => "42";
        }
    }
}
