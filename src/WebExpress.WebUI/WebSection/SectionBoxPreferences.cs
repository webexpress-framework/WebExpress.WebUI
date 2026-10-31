using WebExpress.WebCore.WebSection;

namespace WebExpress.WebUI.WebSection
{
    /// <summary>
    /// Represents the preferences section of a box: fragments registered here are rendered
    /// first, before the primary fragments and before the content the box adds itself. For
    /// the content a box should open with - a notice, a summary line.
    /// </summary>
    /// <remarks>
    /// The section resolves against the runtime type of the box, so a fragment declares
    /// <c>[Scope&lt;TheBoxType&gt;]</c> to reach one box and not every box on the page.
    /// </remarks>
    public class SectionBoxPreferences : ISection
    {
    }
}
