using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control tag.
    /// </summary>
    public class ControlTag : Control
    {
        /// <summary>
        /// Returns or sets the color.
        /// </summary>
        public PropertyColorTag Color
        {
            get => (PropertyColorTag)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
        }

        /// <summary>
        /// Returns or sets the text.
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTag(string id = null)
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
                Class = "wx-webui-tag",
                Role = "tag"
            }
                .AddUserAttribute("data-color-css", Color?.ToClass())
                .AddUserAttribute("data-color-style", Color?.ToStyle())
                .AddUserAttribute("data-value", Value);

            return html;
        }
    }
}
