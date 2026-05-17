using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form item that displays help text.
    /// </summary>
    public class ControlFormItemHelpText : ControlFormItem
    {
        /// <summary>
        /// Gets or sets the size of the text.
        /// </summary>
        public Func<IRenderControlContext, PropertySizeText> Size
        {
            get => (Func<IRenderControlContext, PropertySizeText>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null)?.ToClass(), () => value?.Invoke(null)?.ToStyle());
        }

        /// <summary>
        /// Gets or sets the help text.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemHelpText(string id = null)
            : base(id)
        {
            TextColor = _ => new PropertyColorText(TypeColorText.Muted);
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
            var role = Role?.Invoke(renderContext);
            var text = Text?.Invoke(renderContext);

            return new HtmlElementTextSemanticsSmall()
            {
                Id = Id,
                Text = I18N.Translate(renderContext.Request?.Culture, text),
                Class = Css.Concatenate("", GetClasses()),
                Style = GetStyles(),
                Role = role
            };
        }
    }
}
