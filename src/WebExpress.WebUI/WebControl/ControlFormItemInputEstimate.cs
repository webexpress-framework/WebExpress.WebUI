using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form input control that lets users pick an estimate from a
    /// configurable scale, rendered as selectable chips.
    /// </summary>
    public class ControlFormItemInputEstimate : ControlFormItemInput<ControlFormInputValueUInt>
    {
        /// <summary>
        /// Gets or sets the estimation scale offered as chips. When not set, the
        /// client falls back to a rounded Fibonacci sequence, so authoring a scale
        /// is only required to deviate from that default.
        /// </summary>
        public Func<IRenderControlContext, IEnumerable<int>> Scale { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether re-selecting the active chip
        /// clears the estimate, which lets a user remove an estimate they set.
        /// </summary>
        public Func<IRenderControlContext, bool> AllowClear { get; set; }

        /// <summary>
        /// Gets or sets the chip colors, one per scale value in order, used to
        /// colour-code the estimates (for example a green-to-red effort heat
        /// scale). Each entry accepts a system color (emitted as a CSS class) or a
        /// user-defined color (emitted as an inline style), exactly like a control
        /// button; a null entry leaves the chip on the stylesheet default. When the
        /// whole property is not set, every chip uses the neutral default.
        /// </summary>
        public Func<IRenderControlContext, IEnumerable<PropertyColorBackground>> Colors { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputEstimate()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class with a specified ID.
        /// </summary>
        /// <param name="id">The unique identifier for the control.</param>
        public ControlFormItemInputEstimate(string id)
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
            var value = renderContext.GetValue<ControlFormInputValueUInt>(this)?.ToString
            (
                null,
                renderContext?.Request?.Culture
            );
            var name = Name?.Invoke(renderContext);
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var scale = Scale?.Invoke(renderContext);
            var allowClear = AllowClear?.Invoke(renderContext) ?? false;
            var colors = Colors?.Invoke(renderContext)?.ToList();
            var classes = Classes.ToList();

            if (disabled)
            {
                classes.Add("disabled");
            }

            // the chip colors are emitted as two pipe-separated, index-aligned
            // lists, mirroring the per-element css/style split used elsewhere: a
            // system color contributes a class, a user color an inline style
            var hasColorClass = colors != null && colors.Any(c => c?.ToClass() != null);
            var hasColorStyle = colors != null && colors.Any(c => c?.ToStyle() != null);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-estimate", classes),
                Style = GetStyles(renderContext)
            }
                .AddUserAttribute("name", name)
                .AddUserAttribute("data-scale", scale != null && scale.Any() ? string.Join(",", scale) : null)
                .AddUserAttribute("data-allow-clear", allowClear ? "true" : null)
                .AddUserAttribute("data-colors-css", hasColorClass ? string.Join("|", colors.Select(c => c?.ToClass())) : null)
                .AddUserAttribute("data-colors-style", hasColorStyle ? string.Join("|", colors.Select(c => c?.ToStyle())) : null);

            if (!string.IsNullOrWhiteSpace(value))
            {
                html.AddUserAttribute("data-value", value != uint.MaxValue.ToString()
                    ? value
                    : null);
            }

            return html;
        }

        /// <summary>
        /// Creates a value from the specified string representation, treating a
        /// missing or malformed input as no estimate.
        /// </summary>
        /// <param name="value">The string representation of the estimate to parse.</param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>A value instance representing the parsed estimate.</returns>
        protected override ControlFormInputValueUInt CreateValue(string value, IRenderControlFormContext renderContext)
        {
            uint.TryParse(value, out var result);

            return new ControlFormInputValueUInt(result);
        }
    }
}
