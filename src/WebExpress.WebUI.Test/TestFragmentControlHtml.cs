using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlHtml>()]
    public sealed class TestFragmentControlHtml : FragmentControlHtml
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlHtml(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Html = _ => "<b>TestFragmentControlHtml</b>";
        }
    }
}
