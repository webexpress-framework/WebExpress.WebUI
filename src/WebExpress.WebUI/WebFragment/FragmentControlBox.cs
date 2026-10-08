using WebExpress.WebCore.WebFragment;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Represents a box fragment that can be processed and rendered within a web page.
    /// </summary>
    /// <remarks>
    /// A box is the natural unit a plugin contributes to a page - one framed thing that stands
    /// on its own wherever the page puts it - and this base lets a contributor be the box rather
    /// than wrap one. The body is composed the way every box composes it: from the controls the
    /// fragment adds itself, and from fragments other plugins register for the box sections
    /// under the scope of this fragment's type. A box fragment is therefore both a fragment and
    /// a host of fragments, which is how a page assembles itself from parts that do not know
    /// each other.
    /// </remarks>
    public abstract class FragmentControlBox : ControlBox, IFragmentControl<ControlBox>
    {
        /// <summary>
        /// Gets the context of the fragment.
        /// </summary>
        public IFragmentContext FragmentContext { get; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="fragmentContext">The context of the fragment.</param>
        protected FragmentControlBox(IFragmentContext fragmentContext)
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
            if (!FragmentContext.Check(renderContext?.Request))
            {
                return null;
            }

            return base.Render(renderContext, visualTree);
        }
    }
}
