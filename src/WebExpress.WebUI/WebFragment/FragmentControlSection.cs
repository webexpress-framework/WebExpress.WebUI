using WebExpress.WebCore.WebFragment;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Represents a flat, collapsible section fragment that can be processed and rendered
    /// within a web page.
    /// </summary>
    /// <remarks>
    /// A page built from sections is usually built from fragments as well - one contributor per
    /// section - and this base lets a contributor be the section rather than wrap one. The
    /// fragment id doubles as the control id, so the section remembers its folded state under a
    /// key that is stable for as long as the fragment type is.
    /// </remarks>
    public abstract class FragmentControlSection : ControlSection, IFragmentControl<ControlSection>
    {
        /// <summary>
        /// Gets the context of the fragment.
        /// </summary>
        public IFragmentContext FragmentContext { get; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="fragmentContext">The context of the fragment.</param>
        protected FragmentControlSection(IFragmentContext fragmentContext)
            : base(fragmentContext?.FragmentId?.ToString()?.Replace(".", "-"))
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
