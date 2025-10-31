using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a static text form item control.
    /// </summary>
    public class ControlFormItemStaticText : ControlFormItem, IControlFormLabel
    {
        /// <summary>
        /// Returns or sets the label.
        /// </summary>
        public string Label { get; set; }

        /// <summary>
        /// Returns or sets the text.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemStaticText(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Initializes the form element.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        public override void Initialize(IRenderControlFormContext renderContext)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentP()
            {
                Id = Id,
                Text = I18N.Translate(renderContext.Request?.Culture, Text),
                Class = Css.Concatenate(GetClasses()),
                Style = Style.Concatenate(GetStyles()),
                Role = Role
            };

            return html;
        }
    }
}
