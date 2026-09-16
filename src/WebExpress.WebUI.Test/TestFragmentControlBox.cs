using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment-based <see cref="FragmentControlBox"/> used in unit tests to verify
    /// that the box composes its body from its own content and from the fragments registered
    /// for its sections under the scope of this type.
    /// </summary>
    [Section<TestSectionFragmentControlBox>()]
    public sealed class TestFragmentControlBox : FragmentControlBox
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="fragmentContext">The context of the fragment.</param>
        public TestFragmentControlBox(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Header = _ => "FragmentBox";
            Add(new ControlText() { Text = _ => "fragment-content" });
        }
    }
}
