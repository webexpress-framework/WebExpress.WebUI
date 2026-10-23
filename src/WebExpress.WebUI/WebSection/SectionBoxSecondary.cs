using WebExpress.WebCore.WebSection;

namespace WebExpress.WebUI.WebSection
{
    /// <summary>
    /// Represents the secondary section of a box: fragments registered here are rendered
    /// last, after the content the box adds itself. For content that follows up - a
    /// footnote, a link onward.
    /// </summary>
    /// <remarks>
    /// The section resolves against the runtime type of the box, so a fragment declares
    /// <c>[Scope&lt;TheBoxType&gt;]</c> to reach one box and not every box on the page.
    /// </remarks>
    public class SectionBoxSecondary : ISection
    {
    }
}
