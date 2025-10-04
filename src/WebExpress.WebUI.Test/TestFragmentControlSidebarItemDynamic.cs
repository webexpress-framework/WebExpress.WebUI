using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebFragment;

namespace WebExpress.WebUI.Test
{
    /// <summary>
    /// A dummy fragment for testing purposes.
    /// </summary>
    [Section<TestSectionFragmentControlSidebarItemDynamic>()]
    public sealed class TestFragmentControlSidebarItemDynamic : FragmentControlSidebarItemDynamic
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public TestFragmentControlSidebarItemDynamic(IFragmentContext fragmentContext)
            : base(fragmentContext)
        {
            RenderControl += (renderContext, visualTree) =>
            {
                return new ControlText()
                {
                    Text = "FragmentControlSidebarItemDynamic"
                }
                    .Render(renderContext, visualTree);
            };
        }
    }
}
