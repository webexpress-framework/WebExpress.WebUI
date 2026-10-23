using WebExpress.WebCore.WebSection;

namespace WebExpress.WebUI.WebSection
{
    /// <summary>
    /// Represents the primary section of a box: fragments registered here are rendered after
    /// the preferences fragments and before the content the box adds itself. The section a
    /// contributor reaches for by default.
    /// </summary>
    /// <remarks>
    /// The section resolves against the runtime type of the box, so a fragment declares
    /// <c>[Scope&lt;TheBoxType&gt;]</c> to reach one box and not every box on the page.
    /// </remarks>
    public class SectionBoxPrimary : ISection
    {
    }
}
