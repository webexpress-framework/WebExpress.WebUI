using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a text control with various formatting options.
    /// </summary>
    public class ControlCode : Control
    {
        /// <summary>
        /// Returns or sets the size of the text.
        /// </summary>
        public PropertySizeText Size
        {
            get => (PropertySizeText)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
        }

        /// <summary>
        /// Returns or sets the code.
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Returns or sets the programming language type.
        /// </summary>
        public TypeLanguage Language { get; set; } = TypeLanguage.Default;

        /// <summary>
        /// Returns or sets a value indicating whether line numbers should be displayed.
        /// </summary>
        public bool LineNumbers { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlCode(string id = null)
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
            var html = new HtmlElementTextContentPre(new HtmlText(Code))
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-code", GetClasses()),
                Style = GetStyles()
            }
                .AddUserAttribute("data-line-numbers", LineNumbers ? "true" : null)
                .AddUserAttribute("data-language", Language.ToLanguage());

            return html;
        }
    }
}
