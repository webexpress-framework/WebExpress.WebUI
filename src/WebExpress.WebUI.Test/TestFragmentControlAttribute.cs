using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlAttribute>()]
    public sealed class TestFragmentControlAttribute : FragmentControlAttribute
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlAttribute(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Value = "TestFragmentControlAttribute";
        }
    }
}
