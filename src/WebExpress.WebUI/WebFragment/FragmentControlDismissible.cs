using WebExpress.WebCore.WebFragment;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Abstract fragment base for a <see cref="ControlDismissible"/>. A
    /// concrete subclass is declared as a fragment via the
    /// <c>[Section&lt;...&gt;]</c> attribute and can either contribute its own
    /// content through <c>Add(...)</c> or have existing fragment controls
    /// (e.g. a <see cref="FragmentControlText"/>) registered for the
    /// <see cref="WebExpress.WebUI.WebSection.SectionDismissible"/>
    /// section under its own type as scope - mirroring the composition
    /// pattern of <see cref="FragmentControlBox"/>.
    /// </summary>
    public abstract class FragmentControlDismissible : ControlDismissible, IFragmentControl<ControlDismissible>, IFragmentControlDismissible
    {
        /// <summary>
        /// Gets the context of the fragment.
        /// </summary>
        public IFragmentContext FragmentContext { get; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="fragmentContext">The context of the fragment.</param>
        protected FragmentControlDismissible(IFragmentContext fragmentContext)
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
