using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlHeatMap>()]
    public sealed class TestFragmentControlHeatMap : FragmentControlHeatMap
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlHeatMap(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Values = _ => [[1, 2], [3, 4]];
        }
    }
}
