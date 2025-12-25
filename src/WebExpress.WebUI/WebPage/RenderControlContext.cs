using WebExpress.WebCore.WebEndpoint;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebPage;

namespace WebExpress.WebUI.WebPage
{
    /// <summary>
    /// Provides the context for rendering controls within a web page.
    /// </summary>
    public class RenderControlContext : RenderContext, IRenderControlContext
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="renderContext">The render context.</param>
        public RenderControlContext(IRenderContext renderContext)
            : base(renderContext?.Endpoint, renderContext?.PageContext, renderContext?.Request)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="pageContext">>The page context.</param>
        /// <param name="request">The request associated with the rendering context.</param>
        public RenderControlContext(IEndpoint endpoint, IPageContext pageContext, IRequest request)
            : base(endpoint, pageContext, request)
        {
        }
    }
}
