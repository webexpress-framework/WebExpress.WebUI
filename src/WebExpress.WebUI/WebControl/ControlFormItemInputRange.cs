using System;
using System.Globalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A slider form input for choosing a numeric value within a range.
    /// </summary>
    public class ControlFormItemInputRange : ControlFormItemInput<ControlFormInputValueFloat>
    {
        /// <summary>
        /// Gets or sets the minimum allowable value.
        /// </summary>
        public Func<IRenderControlContext, float> Min { get; set; } = _ => 0;

        /// <summary>
        /// Gets or sets the maximum allowable value.
        /// </summary>
        public Func<IRenderControlContext, float> Max { get; set; } = _ => 10;

        /// <summary>
        /// Gets or sets the step size used for incrementing or decrementing values.
        /// </summary>
        public Func<IRenderControlContext, float> Step { get; set; } = _ => 1;

        /// <summary>
        /// Gets or sets the description.
        /// </summary>
        public Func<IRenderControlContext, string> Description { get; set; }

        /// <summary>
        /// Gets or sets whether the radio button is selected.
        /// </summary>
        public Func<IRenderControlContext, bool> Checked { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputRange()
            : this(DeterministicId.Create())
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
            var name = Name?.Invoke(renderContext);
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var min = Min?.Invoke(renderContext) ?? 0;
            var max = Max?.Invoke(renderContext) ?? 10;
            var step = Step?.Invoke(renderContext) ?? 1;

            var html = new HtmlElementFieldInput()
            {
                Id = Id,
                Name = name,
                Class = Css.Concatenate("form-range", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Type = "range",
                Min = min.ToString(CultureInfo.InvariantCulture),
                Max = max.ToString(CultureInfo.InvariantCulture),
                Step = step.ToString(CultureInfo.InvariantCulture),
                Value = value?.ToString(CultureInfo.InvariantCulture),
                Disabled = disabled
            };

            return html;
        }

        /// <summary>
        /// Creates an value from the specified string representation.
        /// </summary>
        /// <param name="value">
        /// The string representation of the value to be parsed and stored.
        /// </param>
        /// <param name="renderContext">
        /// The context in which the control is rendered.
        /// </param>
        /// <returns>
        /// A instance representing the parsed value, or an instance with a default 
        /// value if parsing fails.
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
