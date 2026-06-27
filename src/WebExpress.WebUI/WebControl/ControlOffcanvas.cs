using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an offcanvas drawer that slides in from an edge of the viewport.
    /// The panel only emits its own markup; it is opened by any element carrying
    /// <c>data-bs-toggle="offcanvas"</c> and <c>data-bs-target="#{id}"</c>, wired
    /// by the Bootstrap data API, and closed by its built-in close button.
    /// </summary>
    public class ControlOffcanvas : Control
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Gets the content shown in the body of the panel.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Gets or sets the edge from which the panel slides in.
        /// </summary>
        public Func<IRenderControlContext, TypeOffcanvasPlacement> Placement { get; set; } = _ => TypeOffcanvasPlacement.Start;

        /// <summary>
        /// Gets or sets the title shown in the header of the panel.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the page behind the panel stays
        /// scrollable while the panel is open.
        /// </summary>
        public Func<IRenderControlContext, bool> Scroll { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets a value indicating whether a backdrop is shown behind the
        /// panel. Defaults to <see langword="true"/>.
        /// </summary>
        public Func<IRenderControlContext, bool> Backdrop { get; set; } = _ => true;

        /// <summary>
        /// Initializes a new instance of the class. A stable id is generated when
        /// none is supplied, because the trigger targets it to open the panel.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The content shown in the body of the panel.</param>
        public ControlOffcanvas(string id = null, params IControl[] content)
            : base(id ?? RandomId.Create())
        {
            _content.AddRange(content);
        }

        /// <summary>
        /// Adds one or more controls to the body of the panel.
        /// </summary>
        /// <param name="content">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlOffcanvas Add(params IControl[] content)
        {
            _content.AddRange(content);

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var placement = Placement?.Invoke(renderContext) ?? TypeOffcanvasPlacement.Start;
            var title = Title?.Invoke(renderContext);
            var scroll = Scroll?.Invoke(renderContext) ?? false;
            var backdrop = Backdrop?.Invoke(renderContext) ?? true;
            var iconTheme = visualTree?.IconTheme ?? WebCore.WebIcon.TypeIconTheme.Default;

            var close = new HtmlElementFieldButton()
            {
                Class = "btn wx-button-close"
            }
                .Add(new HtmlElementTextSemanticsI() { Class = new IconXmark(iconTheme).Class })
                .AddUserAttribute("data-bs-dismiss", "offcanvas")
                .AddUserAttribute("aria-label", "close");

            var header = new HtmlElementTextContentDiv
            (
                new HtmlElementTextSemanticsSpan(new HtmlText(title)) { Class = "offcanvas-title" },
                close
            )
            {
                Class = "offcanvas-header"
            };

            var body = new HtmlElementTextContentDiv([.. Content.Select(x => x.Render(renderContext, visualTree))])
            {
                Class = "offcanvas-body"
            };

            return new HtmlElementTextContentDiv(header, body)
            {
                Id = Id,
                Class = Css.Concatenate("offcanvas", placement.ToClass(), GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            }
                .AddUserAttribute("tabindex", "-1")
                .AddUserAttribute("data-bs-scroll", scroll ? "true" : null)
                .AddUserAttribute("data-bs-backdrop", backdrop ? null : "false");
        }
    }
}
