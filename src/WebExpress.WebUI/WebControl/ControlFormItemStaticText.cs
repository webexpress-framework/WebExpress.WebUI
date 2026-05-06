using System;
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
        /// Gets or sets the label.
        /// </summary>
        public Func<IRenderControlContext, string> Label { get; set; }

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

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
            var text = Text?.Invoke(renderContext);
            var role = Role?.Invoke(renderContext);

            var html = new HtmlElementTextContentP()
            {
                Id = Id,
                Text = I18N.Translate(renderContext.Request?.Culture, text),
                Class = Css.Concatenate(GetClasses()),
                Style = Style.Concatenate(GetStyles()),
                Role = role
            };

            return html;
        }
    }
}
