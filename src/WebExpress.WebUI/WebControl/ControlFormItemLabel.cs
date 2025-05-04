using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a label for a form item control.
    /// </summary>
    public class ControlFormItemLabel : ControlFormItem
    {
        /// <summary>
        /// Returns or sets the text of the label.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Returns or sets the associated form field.
        /// </summary>
        public IControlFormItem FormItem { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemLabel(string id = null)
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
            return new HtmlElementFieldLabel()
            {
                Id = Id,
                Text = I18N.Translate(renderContext.Request?.Culture, Text),
                Class = GetClasses(),
                Style = GetStyles(),
                Role = Role,
                For = FormItem != null ?
                    string.IsNullOrWhiteSpace(FormItem.Id) ?
                    FormItem.Name :
                    FormItem.Id :
                    null
            };
        }
    }
}
