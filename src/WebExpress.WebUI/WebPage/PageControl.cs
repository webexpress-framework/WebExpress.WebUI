using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebPage;

namespace WebExpress.WebUI.WebPage
{
    /// <summary>
    /// A (web) page, which is built from controls.
    /// </summary>
    public abstract class PageControl<T> : Page<T> where T : VisualTreeControl, new()
    {
        /// <summary>
        /// Gets the links to the JavaScript files to be used, which are inserted in the header.
        /// </summary>
        protected ICollection<string> HeaderScriptLinks { get; } = [];

        /// <summary>
        /// Gets the links to the css files to use.
        /// </summary>
        protected ICollection<string> CssLinks { get; } = [];

        /// <summary>
        /// Gets the meta information.
        /// </summary>
        protected List<KeyValuePair<string, string>> Meta { get; } = [];

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public PageControl()
        {

        }

        /// <summary>
        /// Processing of the page.
        /// </summary>
        /// <param name="renderContext">The context for rendering the page.</param>
        /// <param name="visualTree">The visual tree control to be processed.</param>
        public override void Process(IRenderContext renderContext, T visualTree)
        {
            visualTree.AddCssLink(CssLinks.ToArray());
            visualTree.AddHeaderScriptLink(HeaderScriptLinks.ToArray());
            //visualTree.AddMeta(Meta);
        }
    }
}
