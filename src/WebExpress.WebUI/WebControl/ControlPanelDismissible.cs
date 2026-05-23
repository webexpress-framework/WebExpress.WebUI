using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebFragment;
using WebExpress.WebUI.WebPage;
using WebExpress.WebUI.WebSection;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a dismissible container panel with a title bar and an "x"
    /// dismiss button in the upper-right corner. The body of the panel can hold
    /// arbitrary controls; in addition, fragments registered for the
    /// <see cref="SectionPanelDismissibleBody"/> section are rendered inline.
    /// </summary>
    /// <remarks>
    /// The actual title/close UI is constructed by the matching JavaScript
    /// controller (<c>webexpress.webui.PanelDismissibleCtrl</c>) so the C#
    /// renderer only emits a host element with the appropriate data attributes
    /// and the body content. The companion <see cref="BindShow"/> attaches the
    /// data-bindings that re-show the panel after the user has dismissed it.
    /// </remarks>
    public class ControlPanelDismissible : Control, IControlPanelDismissible
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Returns the controls that make up the panel body.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Gets or sets the title text rendered in the header bar. The value is
        /// translated through <see cref="I18N"/> before rendering.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets whether the panel starts in the hidden state. Defaults
        /// to <c>false</c> (visible).
        /// </summary>
        public Func<IRenderControlContext, bool> InitialHidden { get; set; }

        /// <summary>
        /// Gets or sets the aria-label used on the dismiss button. Defaults to
        /// the i18n key <c>webexpress.webui:panel.dismiss</c>.
        /// </summary>
        public Func<IRenderControlContext, string> DismissAriaLabel { get; set; }

        /// <summary>
        /// Gets or sets the binding applied to the host element. Use this to
        /// attach the <see cref="BindShow"/> bind that re-opens the panel when
        /// a source list raises a select-item event.
        /// </summary>
        public Func<IRenderControlContext, IBinding> Bind { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="controls">Optional content controls to add up-front.</param>
        public ControlPanelDismissible(string id = null, params IControl[] controls)
            : base(id)
        {
            _content.AddRange(controls.Where(x => x is not null));
        }

        /// <summary>
        /// Adds one or more controls to the panel body.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlPanelDismissible Add(params IControl[] controls)
        {
            _content.AddRange(controls.Where(x => x is not null));

            return this;
        }

        /// <summary>
        /// Adds one or more controls to the panel body.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlPanelDismissible Add(IEnumerable<IControl> controls)
        {
            _content.AddRange(controls.Where(x => x is not null));

            return this;
        }

        /// <summary>
        /// Removes a control from the panel body.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlPanelDismissible Remove(IControl control)
        {
            _content.Remove(control);

            return this;
        }

        /// <summary>
        /// Renders the panel host element. The title, close button and body
        /// wrapper are built by the matching client-side controller.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var title = Title?.Invoke(renderContext);
            var initialHidden = InitialHidden?.Invoke(renderContext) ?? false;
            var dismissAria = DismissAriaLabel?.Invoke(renderContext);
            var role = Role?.Invoke(renderContext);
            var binding = Bind?.Invoke(renderContext);

            var body = RenderBody(renderContext, visualTree);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-panel-dismissible", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = role
            }
                .AddUserAttribute("data-title", I18N.Translate(renderContext, title))
                .AddUserAttribute("data-initial-hidden", initialHidden ? "true" : null)
                .AddUserAttribute("data-dismiss-aria", I18N.Translate(renderContext, dismissAria))
                .Add(body);

            binding?.ApplyUserAttributes(html);

            return html;
        }

        /// <summary>
        /// Renders the body content. Direct child controls are emitted first,
        /// followed by fragments registered for the
        /// <see cref="SectionPanelDismissibleBody"/> section. Override in a
        /// fragment-aware subclass to extend the composition.
        /// </summary>
        /// <param name="renderContext">The render context.</param>
        /// <param name="visualTree">The visual tree.</param>
        /// <returns>The rendered body html nodes.</returns>
        protected virtual IEnumerable<IHtmlNode> RenderBody(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            foreach (var node in _content.Select(x => x?.Render(renderContext, visualTree)))
            {
                yield return node;
            }

            var fragmentManager = WebEx.ComponentHub?.FragmentManager;
            if (fragmentManager is null)
            {
                yield break;
            }

            var applicationContext = renderContext?.PageContext?.ApplicationContext;
            var bodyFragments = fragmentManager.GetFragments<IFragmentControlPanelDismissibleBody, SectionPanelDismissibleBody>
            (
                applicationContext,
                [GetType()]
            );

            foreach (var fragment in bodyFragments)
            {
                yield return fragment.Render(renderContext, visualTree);
            }
        }
    }
}
