using WebExpress.WebCore.WebFragment;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Abstract fragment base for a <see cref="ControlPanelDismissible"/>. A
    /// concrete subclass is declared as a fragment via the
    /// <c>[Section&lt;...&gt;]</c> attribute and can either contribute its own
    /// content through <c>Add(...)</c> or pull additional fragments in through
    /// the <see cref="WebExpress.WebUI.WebSection.SectionPanelDismissibleBody"/>
    /// section - mirroring the composition pattern of
    /// <see cref="FragmentControlView"/>.
    /// </summary>
    public abstract class FragmentControlPanelDismissible : ControlPanelDismissible, IFragmentControl<ControlPanelDismissible>, IFragmentControlPanelDismissible
    {
        /// <summary>
        /// Gets the context of the fragment.
        /// </summary>
        public IFragmentContext FragmentContext { get; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="fragmentContext">The context of the fragment.</param>
        protected FragmentControlPanelDismissible(IFragmentContext fragmentContext)
            : base(fragmentContext?.FragmentId?.ToString()?.Replace(".", "-"))
        {
            FragmentContext = fragmentContext;
        }

        /// <summary>
        /// Renders the fragment. The base panel is only emitted when the
        /// fragment conditions accept the current request, otherwise null is
        /// returned so the host page can skip the slot entirely.
        /// </summary>
        /// <param name="renderContext">The context in which the fragment is rendered.</param>
        /// <param name="visualTree">The visual tree used for rendering the fragment.</param>
        /// <returns>An HTML node representing the rendered fragment, or null.</returns>
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
