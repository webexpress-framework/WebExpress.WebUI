using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebFragment;
using WebExpress.WebUI.WebSection;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment contributing to the preferences section of <see cref="TestFragmentControlBox"/>.
    /// It is scoped to that box type, so no other box on the page receives it.
    /// </summary>
    [Section<SectionBoxPreferences>()]
    [Scope<TestFragmentControlBox>]
    public sealed class TestFragmentControlBoxPreferences : FragmentControlText
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="fragmentContext">The context of the fragment.</param>
        public TestFragmentControlBoxPreferences(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Text = _ => "preferences-fragment";
            Format = _ => TypeFormatText.Paragraph;
        }
    }
}
