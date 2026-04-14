using WebExpress.WebCore.WebFragment;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Represents a dropdown navigation item that is associated with a fragment and can be rendered as part of a
    /// control navigation structure.
    /// </summary>
    /// <remarks>This class extends <see cref="ControlNavigationItemDropdown"/> to include fragment-specific
    /// functionality, such as rendering based on fragment conditions. It is typically used in scenarios where
    /// navigation items are dynamically generated based on fragment contexts.</remarks>
    public abstract class FragmentControlNavigationItemDropdown : ControlNavigationItemDropdown, IFragmentControl<ControlNavigationItemDropdown>, IFragmentControlNavigationItem
    {
        /// <summary>
        /// Returns the context of the fragment.
        /// </summary>
        public IFragmentContext FragmentContext { get; private set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="fragmentContext">The context of the fragment.</param>
        public FragmentControlNavigationItemDropdown(IFragmentContext fragmentContext)
            : base(fragmentContext?.FragmentId?.ToString())
        {
            FragmentContext = fragmentContext;
        }

        /// <summary>
        /// Convert the fragment to HTML.
        /// </summary>
        /// <param name="renderContext">The context in which the fragment is rendered.</param>
        /// <param name="visualTree">The visual tree used for rendering the fragment.</param>
        /// <returns>An HTML node representing the rendered fragments. Can be null if no nodes are present.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            if (!FragmentContext.Conditions.Check(renderContext?.Request))
            {
                return null;
            }

            return base.Render(renderContext, visualTree);
        }
    }
}
