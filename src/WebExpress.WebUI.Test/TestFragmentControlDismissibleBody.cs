using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebFragment;
using WebExpress.WebUI.WebSection;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment contributing to the body of <see cref="TestFragmentControlDismissible"/>.
    /// It is an ordinary text fragment - the panel body takes any fragment control - and it is
    /// scoped to that panel type, so no other dismissible panel on the page receives it.
    /// </summary>
    [Section<SectionDismissible>()]
    [Scope<TestFragmentControlDismissible>]
    public sealed class TestFragmentControlDismissibleBody : FragmentControlText
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="fragmentContext">The context of the fragment.</param>
        public TestFragmentControlDismissibleBody(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Text = _ => "body-fragment";
            Format = _ => TypeFormatText.Paragraph;
        }
    }
}
