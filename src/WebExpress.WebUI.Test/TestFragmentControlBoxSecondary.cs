using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebFragment;
using WebExpress.WebUI.WebSection;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment contributing to the secondary section of <see cref="TestFragmentControlBox"/>.
    /// It is scoped to that box type, so no other box on the page receives it.
    /// </summary>
    [Section<SectionBoxSecondary>()]
    [Scope<TestFragmentControlBox>]
    public sealed class TestFragmentControlBoxSecondary : FragmentControlText
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="fragmentContext">The context of the fragment.</param>
        public TestFragmentControlBoxSecondary(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Text = _ => "secondary-fragment";
            Format = _ => TypeFormatText.Paragraph;
        }
    }
}
