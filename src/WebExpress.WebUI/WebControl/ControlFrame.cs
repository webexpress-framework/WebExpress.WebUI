using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Embeds external HTML content into the current page, similar to an iframe,
    /// but with full DOM integration and optional fragment targeting.
    /// </summary>
    public class ControlFrame : Control
    {
        /// <summary>
        /// Gets or sets the URI associated with the current resource.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the CSS selector used to identify elements in the DOM.
        /// </summary>
        public Func<IRenderControlContext, string> Selector { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id.</param>
        public ControlFrame(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var role = Role?.Invoke(renderContext);
            var uri = Uri?.Invoke(renderContext);
            var selector = Selector?.Invoke(renderContext);

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-frame", GetClasses()),
                Style = GetStyles(),
                Role = role
            }
                .AddUserAttribute("data-uri", uri?.ToString())
                .AddUserAttribute("data-selector", selector);
        }
    }
}
