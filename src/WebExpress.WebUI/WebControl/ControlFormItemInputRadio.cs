using System.Runtime.CompilerServices;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a radio button input form item control.
    /// </summary>
    /// <remarks>
    /// This class provides the functionality for a radio button input within a form.
    /// </remarks>
    public class ControlFormItemInputRadio : ControlFormItemInput<ControlFormInputValueString>
    {
        /// <summary>
        /// Returns or sets the value of the optiopn.
        /// </summary>
        public string Option { get; set; }

        /// <summary>
        /// Liefert oder setzt ob die Checkbox in einer neuen Zeile angezeigt werden soll
        /// </summary>
        public bool Inline { get; set; }

        /// <summary>
        /// Returns or sets the description.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Returns or sets whether the radio button is selected
        /// </summary>
        public bool Checked { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        /// <param name="instance">The name of the calling member. This is automatically provided by the compiler.</param>
        /// <param name="file">The file path of the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="line">The line number in the source file where this instance is created. This is automatically provided by the compiler.</param>
        public ControlFormItemInputRadio([CallerMemberName] string instance = null, [CallerFilePath] string file = null, [CallerLineNumber] int? line = null)
            : this($"radio_{instance}_{file}_{line}".GetHashCode().ToString("X"))
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputRadio(string id)
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
            var value = renderContext?.GetValue<ControlFormInputValueString>(this)?.Text;

            if (!string.IsNullOrWhiteSpace(value))
            {
                Checked = value == Option;
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("form-check", Inline ? "form-check-inline" : null, GetClasses()),
                Style = GetStyles(),
            }
                .Add(new HtmlElementFieldInput()
                {
                    Name = Name,
                    Type = "radio",
                    Value = Option,
                    Disabled = Disabled,
                    Class = Css.Concatenate("form-check-input"),
                    Checked = Checked
                })
                .Add(new HtmlElementFieldLabel()
                {
                    Class = Css.Concatenate("form-check-label"),
                    For = Id
                }
                    .Add(new HtmlText(string.IsNullOrWhiteSpace(Description) ?
                        string.Empty :
                        I18N.Translate(renderContext.Request?.Culture, Description)
                    )));

            return html;
        }

        /// <summary>
        /// Creates an value from the specified string representation.
        /// </summary>
        /// <param name="value">
        /// The string representation of the value to be converted. Cannot be null.
        /// </param>
        /// <returns>
        /// The value created from the specified string representation.
        /// </returns>
        protected override ControlFormInputValueString CreateValue(string value)
        {
            return new ControlFormInputValueString
            {
                Text = value
            };
        }
    }
}
