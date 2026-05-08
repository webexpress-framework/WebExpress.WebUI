using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlImage>()]
    public sealed class TestFragmentControlImage : FragmentControlImage
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlImage(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Uri = _ => new UriEndpoint("/a/b/c");
        }
    }
}
