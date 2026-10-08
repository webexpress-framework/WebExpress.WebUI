using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlCode>()]
    public sealed class TestFragmentControlCode : FragmentControlCode
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlCode(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Code = _ => "print('TestFragmentControlCode')";
        }
    }
}
