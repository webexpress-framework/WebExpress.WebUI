using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlText>()]
    public sealed class TestFragmentControlText : FragmentControlText
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlText(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Text = _ => "TestFragmentControlText";
            Format = _ => TypeFormatText.Paragraph;
        }
    }
}
