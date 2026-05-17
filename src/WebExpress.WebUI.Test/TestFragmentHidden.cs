using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebCore.WebScope;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentHidden>()]
    [Scope<IScope>]
    [Condition<TestConditionAlwaysFalse>]
    public sealed class TestFragmentHidden : FragmentControlText
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentHidden(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            Text = _ => "TestFragmentHidden";
        }
    }
}
