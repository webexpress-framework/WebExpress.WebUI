using System;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form input control that lets the user pick a traffic light state by clicking
    /// one of the red, yellow or green lamps. The selected lamp token (red, yellow, green or an
    /// empty string for off) is submitted as the field value.
    /// </summary>
    public class ControlFormItemInputTrafficLight : ControlFormItemInput<ControlFormInputValueString>
    {
        /// <summary>
        /// Gets or sets how the lamps are arranged. Defaults to
        /// <see cref="TypeOrientationTrafficLight.Vertical"/>.
        /// </summary>
        public Func<IRenderControlContext, TypeOrientationTrafficLight> Orientation { get; set; }

        /// <summary>
        /// Gets or sets whether clicking the lit lamp again clears the selection back to off.
        /// Defaults to <c>true</c>; set it to <c>false</c> when a state must always be selected.
        /// </summary>
        public Func<IRenderControlContext, bool> AllowOff { get; set; } = _ => true;

        /// <summary>
        /// Gets or sets the size of the lamps. Defaults to the compact
        /// <see cref="TypeSizeTrafficLight.Default"/>.
        /// </summary>
        public Func<IRenderControlContext, TypeSizeTrafficLight> Size { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned id.
        /// </summary>
        public ControlFormItemInputTrafficLight()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class with a specified id.
        /// </summary>
        /// <param name="id">The unique identifier for the control.</param>
        public ControlFormItemInputTrafficLight(string id)
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
            var value = renderContext.GetValue<ControlFormInputValueString>(this)?.ToString
            (
                null,
                renderContext?.Request?.Culture
            );
            var name = Name?.Invoke(renderContext);
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var orientation = Orientation?.Invoke(renderContext) ?? TypeOrientationTrafficLight.Vertical;
            var allowOff = AllowOff?.Invoke(renderContext) ?? true;
            var size = Size?.Invoke(renderContext) ?? TypeSizeTrafficLight.Default;
            var classes = Classes.ToList();

            var sizeClass = size.ToClass();
            if (!string.IsNullOrEmpty(sizeClass))
            {
                classes.Insert(0, sizeClass);
            }

            if (disabled)
            {
                classes.Add("disabled");
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-traffic-light", classes),
                Style = GetStyles(renderContext)
            }
                .AddUserAttribute("name", name)
                // the vertical default and the allow-off default are implied; only deviations are emitted
                .AddUserAttribute("data-orientation", orientation == TypeOrientationTrafficLight.Horizontal ? orientation.ToValue() : null)
                .AddUserAttribute("data-allow-off", allowOff ? null : "false");

            if (!string.IsNullOrWhiteSpace(value))
            {
                html.AddUserAttribute("data-value", value);
            }

            return html;
        }

        /// <summary>
        /// Creates a value from the specified string representation.
        /// </summary>
        /// <param name="value">The string representation of the state to be stored.</param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>A <see cref="ControlFormInputValueString"/> instance holding the state token.</returns>
        protected override ControlFormInputValueString CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueString(value);
        }
    }
}
