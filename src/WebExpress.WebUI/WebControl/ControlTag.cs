using WebExpress.WebCore.Internationalization;
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
        /// Returns or sets the layout.
        /// </summary>
        public PropertyColorBackgroundBadge Layout
        {
            get => (PropertyColorBackgroundBadge)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
        }

        /// <summary>
        /// Return or specifies whether rounded corners should be used.
        /// </summary>
        public bool Pill { get; set; }

        /// <summary>
        /// Returns or sets the text.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTag(string id = null)
            : base(id)
        {
            Pill = true;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(renderContext, Text)))
            {
                Id = Id,
                Class = "wx-tag" + (Pill ? " wx-tag-pill" : string.Empty),
                Role = "tag"
            };

            return html;
        }
    }
}
