using System.Runtime.CompilerServices;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a color input form item control.
    /// </summary>
    public class ControlFormItemInputColor : ControlFormItemInput<ControlFormInputValueString>
    {
        /// <summary>
        /// Returns or sets the color value.
        /// </summary>
        public string Color { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        /// <param name="instance">The name of the calling member. This is automatically provided by the compiler.</param>
        /// <param name="file">The file path of the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="line">The line number in the source file where this instance is created. This is automatically provided by the compiler.</param>
        public ControlFormItemInputColor([CallerMemberName] string instance = null, [CallerFilePath] string file = null, [CallerLineNumber] int? line = null)
            : this($"color_{instance}_{file}_{line}".GetHashCode().ToString("X"))
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id.</param>
        public ControlFormItemInputColor(string id)
            : base(id)
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
            var value = renderContext.GetValue<ControlFormInputValueString>(this)?.Text;

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-color", GetClasses()),
                Style = GetStyles(),
            }
              .AddUserAttribute("data-value", value ?? Color);

            return html;
        }

        /// <summary>
        /// Creates an value from the specified string representation.
        /// </summary>
        /// <param name="value">
        /// The string representation of the value to be converted. Cannot be null.
        /// </param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>
        /// The value created from the specified string representation.
        /// </returns>
        protected override ControlFormInputValueString CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueString
            {
                Text = value
            };
        }
    }
}
