using System.Globalization;
using System.Runtime.CompilerServices;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a range input form item control.
    /// </summary>
    /// <remarks>
    /// This class provides the functionality for a range input within a form.
    /// </remarks>
    public class ControlFormItemInputRange : ControlFormItemInput<ControlFormInputValueFloat>
    {
        /// <summary>
        /// Returns or sets the minimum allowable value.
        /// </summary>
        public float Min { get; set; } = 0;

        /// <summary>
        /// Returns or sets the maximum allowable value.
        /// </summary>
        public float Max { get; set; } = 10;

        /// <summary>
        /// Returns or sets the step size used for incrementing or decrementing values.
        /// </summary>
        public float Step { get; set; } = 1;

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
        public ControlFormItemInputRange([CallerMemberName] string instance = null, [CallerFilePath] string file = null, [CallerLineNumber] int? line = null)
            : this($"range_{instance}_{file}_{line}".GetHashCode().ToString("X"))
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputRange(string id)
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
            var value = renderContext?.GetValue<ControlFormInputValueFloat>(this)?.Number;

            var html = new HtmlElementFieldInput()
            {
                Id = Id,
                Name = Name,
                Class = Css.Concatenate("form-range", GetClasses()),
                Style = GetStyles(),
                Type = "range",
                Min = Min.ToString(CultureInfo.InvariantCulture),
                Max = Max.ToString(CultureInfo.InvariantCulture),
                Step = Step.ToString(CultureInfo.InvariantCulture),
                Value = value?.ToString(CultureInfo.InvariantCulture),
                Disabled = Disabled
            };

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
        protected override ControlFormInputValueFloat CreateValue(string value, IRenderControlFormContext renderContext)
        {
            var res = float.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var number)
                ? number
                : 0.0f;

            return new ControlFormInputValueFloat(res);
        }
    }
}
