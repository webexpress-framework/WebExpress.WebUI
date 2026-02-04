using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that displays color information and provides HTML rendering capabilities.
    /// </summary>
    public class ControlColor : Control
    {
        /// <summary>
        /// Returns or sets the color.
        /// </summary>
        public string Color { get; set; }

        /// <summary>
        /// Returns or sets the tooltip text.
        /// </summary>
        public string Tooltip { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlColor(string id = null)
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
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-color", GetClasses()),
                Style = GetStyles()
            }
                .AddUserAttribute("data-value", Color)
                .AddUserAttribute("data-tooltip", I18N.Translate(renderContext, Tooltip));

            return html;
        }
    }
}
