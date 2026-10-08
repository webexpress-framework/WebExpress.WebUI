using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlSla>()]
    public sealed class TestFragmentControlSla : FragmentControlSla
    {
        /// <summary>
        /// The moment the fragment is rendered at. It is pinned so the markup of
        /// the fragment is a value rather than whatever the clock says.
        /// </summary>
        private static readonly DateTime _reference = new(2026, 8, 1, 8, 0, 0);

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlSla(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Label = _ => "TestFragmentControlSla";
            Start = _ => _reference;
            Target = _ => TimeSpan.FromHours(4);
            Now = _ => _reference.AddHours(1);
            ShowActions = _ => false;
        }
    }
}
