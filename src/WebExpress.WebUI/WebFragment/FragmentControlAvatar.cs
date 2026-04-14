using WebExpress.WebCore.WebFragment;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Represents a avatar control fragment that can be processed and rendered within a web page.
    /// </summary>
    public abstract class FragmentControlAvatar : ControlAvatar, IFragmentControl<ControlAvatar>
    {
        /// <summary>
        /// Returns the context of the fragment.
        /// </summary>
        public IFragmentContext FragmentContext { get; private set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="fragmentContext">The context of the fragment.</param>
        /// <param name="id">
        /// The unique identifier for the modal remote form control. If null, the fragment 
        /// Id will be used.
        /// </param>
        public FragmentControlAvatar(IFragmentContext fragmentContext, string id = null)
            : base(id ?? fragmentContext?.FragmentId?.ToString())
        {
            FragmentContext = fragmentContext;
        }

        /// <summary>
        /// Convert the fragment to HTML.
        /// </summary>
        /// <param name="renderContext">The context in which the fragment is rendered.</param>
        /// <param name="visualTree">The visual tree used for rendering the fragment.</param>
        /// <returns>
        /// An HTML node representing the rendered fragments. Can be null if no nodes are present.
        /// </returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            if (!FragmentContext.Conditions.Check(renderContext?.Request))
            {
                return null;
            }

            return base.Render
            (
                renderContext,
                visualTree,
                GetUsername(renderContext),
                GetImage(renderContext),
                Uri,
                PrimaryAction,
                SecondaryAction
            );
        }

        /// <summary>
        /// Retrieves the username associated with the specified render context.
        /// </summary>
        /// <param name="renderContext">
        /// The render context from which to obtain the username. Cannot be null.
        /// </param>
        /// <returns>
        /// The username as a string. Returns an empty string if no username is available.
        /// </returns>
        public virtual string GetUsername(IRenderControlContext renderContext)
        {
            return Username;
        }

        /// <summary>
        /// Retrieves the URI for the default avatar image used in the application.
        /// </summary>
        /// <param name="renderContext">
        /// The rendering context that provides access to the current page and application context. 
        /// Cannot be null.
        /// </param>
        /// <returns>
        /// An object representing the URI of the default avatar image. Returns null if the application 
        /// context is unavailable.
        /// </returns>
        public virtual IUri GetImage(IRenderControlContext renderContext)
        {
            var applicationContet = renderContext.PageContext.ApplicationContext;

            return Image ?? applicationContet?.Route.Concat("/webexpress.webapp/assets/img/avatar.svg")?.ToUri();
        }
    }
}