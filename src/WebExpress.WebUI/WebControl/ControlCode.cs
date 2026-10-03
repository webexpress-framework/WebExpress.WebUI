using System;
using System.Text;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Renders a read-only block of source code with a copy button and, optionally, line numbers.
    /// Only when a <see cref="TypeLanguage"/> other than the default is chosen does the client add
    /// a header with the language name and syntax highlighting; without one the code stays plain
    /// text, since there is no language to name or highlight. The code is transferred
    /// base64-encoded, so it reaches the client exactly as given, whitespace and markup characters
    /// included.
    /// </summary>
    public class ControlCode : Control
    {
        /// <summary>
        /// Gets or sets the size of the text.
        /// </summary>
        public Func<IRenderControlContext, PropertySizeText> Size
        {
            get => (Func<IRenderControlContext, PropertySizeText>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass(), (renderContext) => value?.Invoke(renderContext)?.ToStyle());
        }

        /// <summary>
        /// Gets or sets the code.
        /// </summary>
        public Func<IRenderControlContext, string> Code { get; set; }

        /// <summary>
        /// Gets or sets the programming language type.
        /// </summary>
        public Func<IRenderControlContext, TypeLanguage> Language { get; set; } = _ => TypeLanguage.Default;

        /// <summary>
        /// Gets or sets a value indicating whether line numbers should be displayed.
        /// </summary>
        public Func<IRenderControlContext, bool> LineNumbers { get; set; }

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
            var code = Code?.Invoke(renderContext) ?? "";
            var lineNumbers = LineNumbers?.Invoke(renderContext) ?? false;
            var language = Language?.Invoke(renderContext) ?? TypeLanguage.Default;
            var decode = Convert.ToBase64String(Encoding.UTF8.GetBytes(code ?? ""));

            var html = new HtmlElementTextContentPre(new HtmlText(decode))
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-code", GetClasses(renderContext)),
                Style = GetStyles(renderContext)
            }
                .AddUserAttribute("data-line-numbers", lineNumbers ? "true" : null)
                .AddUserAttribute("data-language", language.ToLanguage())
                .AddUserAttribute("data-base64", "true");

            return html;
        }
    }
}
