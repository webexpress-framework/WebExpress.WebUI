using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebFragment;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// Abstract base class for body fragments of a
    /// <c>ControlPanelDismissible</c>. Derived classes simply add controls to
    /// the inherited content list; the fragment-context conditions decide at
    /// render time whether the fragment is included.
    /// </summary>
    public abstract class FragmentControlPanelDismissibleBody : IFragmentControlPanelDismissibleBody
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Gets the context of the fragment.
        /// </summary>
        public IFragmentContext FragmentContext { get; }

        /// <summary>
        /// Gets the id of the fragment.
        /// </summary>
        public string Id { get; }

        /// <summary>
        /// Gets the controls that make up the fragment.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="fragmentContext">The context of the fragment.</param>
        protected FragmentControlPanelDismissibleBody(IFragmentContext fragmentContext)
        {
            FragmentContext = fragmentContext;
            Id = fragmentContext?.FragmentId?.ToString()?.Replace(".", "-");
        }

        /// <summary>
        /// Adds one or more controls to the fragment content.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public FragmentControlPanelDismissibleBody Add(params IControl[] controls)
        {
            _content.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Adds one or more controls to the fragment content.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public FragmentControlPanelDismissibleBody Add(IEnumerable<IControl> controls)
        {
            _content.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Renders the fragment.
        /// </summary>
        /// <param name="renderContext">The context in which the fragment is rendered.</param>
        /// <param name="visualTree">The visual tree used for rendering the fragment.</param>
        /// <returns>An HTML node representing the rendered fragment, or null when the conditions reject the request.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            if (FragmentContext is not null && !FragmentContext.Conditions.Check(renderContext?.Request))
            {
                return null;
            }

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-panel-dismissible-fragment"
            }
                .Add(_content.Select(x => x?.Render(renderContext, visualTree)));
        }
    }
}
