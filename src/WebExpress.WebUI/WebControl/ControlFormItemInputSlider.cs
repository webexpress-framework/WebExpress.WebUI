using System;
using System.Globalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a dual-handle range slider form input. In contrast to
    /// <see cref="ControlFormItemInputRange"/> (which is a single-handle
    /// HTML <c>&lt;input type="range"&gt;</c>), this control lets the user
    /// pick a sub-range bounded by two handles. The interval between the
    /// handles is rendered as a colored band so the selection is visually
    /// connected.
    ///
    /// The numeric scale is generic: by combining <see cref="Step"/> with
    /// <see cref="Unit"/> the same control supports plain numbers,
    /// temperatures, percentages, durations and time-of-day (where the
    /// underlying value is expressed in minutes since midnight). The lower
    /// handle, the upper handle and the connecting band are styled together
    /// via <see cref="Color"/>, see <see cref="PropertyColorSlider"/>.
    /// </summary>
    public class ControlFormItemInputSlider : ControlFormItemInput<ControlFormInputValueDualRange>
    {
        /// <summary>
        /// Gets or sets the lower bound of the track.
        /// </summary>
        public Func<IRenderControlContext, float> Min { get; set; } = _ => 0;

        /// <summary>
        /// Gets or sets the upper bound of the track.
        /// </summary>
        public Func<IRenderControlContext, float> Max { get; set; } = _ => 100;

        /// <summary>
        /// Gets or sets the step size used when snapping the handles.
        /// </summary>
        public Func<IRenderControlContext, float> Step { get; set; } = _ => 1;

        /// <summary>
        /// Gets or sets the unit identifier used by the client to pick a
        /// formatter for the value labels. Supported built-in formatters
        /// are <c>number</c> (default), <c>temperature</c>, <c>percent</c>,
        /// <c>duration</c> and <c>time</c>. Any other value is treated as
        /// a literal suffix.
        /// </summary>
        public Func<IRenderControlContext, string> Unit { get; set; }

        /// <summary>
        /// Gets or sets the color that styles both handles and the
        /// connecting band as a single unit. Pass either a
        /// <see cref="TypeColorSlider"/> for one of the theme colors, or
        /// any CSS color expression (e.g. a <c>linear-gradient(...)</c>)
        /// via the <see cref="PropertyColorSlider(string)"/> constructor.
        /// </summary>
        public virtual Func<IRenderControlContext, PropertyColorSlider> Color
        {
            get => (Func<IRenderControlContext, PropertyColorSlider>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass(), (renderContext) => value?.Invoke(renderContext)?.ToStyle());
        }

        /// <summary>
        /// Gets or sets the description rendered next to the control.
        /// </summary>
        public Func<IRenderControlContext, string> Description { get; set; }

        /// <summary>
        /// Gets or sets whether the value labels next to each handle should
        /// be rendered (defaults to <c>true</c>).
        /// </summary>
        public Func<IRenderControlContext, bool> ShowLabels { get; set; } = _ => true;

        /// <summary>
        /// Initializes a new instance of the class with an automatically
        /// assigned ID.
        /// </summary>
        public ControlFormItemInputSlider()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputSlider(string id)
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
            var name = Name?.Invoke(renderContext);
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var min = Min?.Invoke(renderContext) ?? 0;
            var max = Max?.Invoke(renderContext) ?? 100;
            var step = Step?.Invoke(renderContext) ?? 1;
            var unit = Unit?.Invoke(renderContext);
            var showLabels = ShowLabels?.Invoke(renderContext) ?? true;

            // clamp the current value to the track so the rendering can never
            // produce handles outside the visible scale
            var value = renderContext?.GetValue<ControlFormInputValueDualRange>(this);
            var minValue = ClampToTrack(value?.MinValue ?? min, min, max);
            var maxValue = ClampToTrack(value?.MaxValue ?? max, min, max);
            if (maxValue < minValue)
            {
                (minValue, maxValue) = (maxValue, minValue);
            }

            // GetClasses() picks up the color marker class produced by
            // PropertyColorSlider.ToClass(); GetStyles() picks up the inline
            // CSS-variable override for user-defined colors
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate
                (
                    "wx-webui-input-slider",
                    GetClasses(renderContext),
                    disabled ? "disabled" : null
                ),
                Style = GetStyles(renderContext)
            }
                .AddUserAttribute("name", name)
                .AddUserAttribute("data-min", min.ToString(CultureInfo.InvariantCulture))
                .AddUserAttribute("data-max", max.ToString(CultureInfo.InvariantCulture))
                .AddUserAttribute("data-step", step.ToString(CultureInfo.InvariantCulture))
                .AddUserAttribute("data-value-min", minValue.ToString(CultureInfo.InvariantCulture))
                .AddUserAttribute("data-value-max", maxValue.ToString(CultureInfo.InvariantCulture));

            if (!string.IsNullOrWhiteSpace(unit))
            {
                html.AddUserAttribute("data-unit", unit);
            }
            if (!showLabels)
            {
                html.AddUserAttribute("data-show-labels", "false");
            }
            if (disabled)
            {
                html.AddUserAttribute("disabled", "disabled");
            }

            return html;
        }

        /// <summary>
        /// Parses the payload posted by the JavaScript component (a single
        /// hidden input carrying <c>min;max</c>) back into a
        /// <see cref="ControlFormInputValueDualRange"/>.
        /// </summary>
        /// <param name="value">The serialized payload.</param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>A parsed range value, or an empty range when the input is missing.</returns>
        protected override ControlFormInputValueDualRange CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueDualRange(value);
        }

        /// <summary>
        /// Restricts <paramref name="value"/> to the closed interval
        /// <c>[min, max]</c>.
        /// </summary>
        /// <param name="value">The value to clamp.</param>
        /// <param name="min">The lower bound.</param>
        /// <param name="max">The upper bound.</param>
        /// <returns>The clamped value.</returns>
        private static float ClampToTrack(float value, float min, float max)
        {
            if (value < min) return min;
            if (value > max) return max;
            return value;
        }
    }
}
