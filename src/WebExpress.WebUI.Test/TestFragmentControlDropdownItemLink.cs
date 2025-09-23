using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlDropdownItemLink>()]
    public sealed class TestFragmentControlDropdownItemLink : FragmentControlDropdownItemLink
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlDropdownItemLink(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Text = "TestFragmentControlDropdownItemLink";
        }
    }
}
