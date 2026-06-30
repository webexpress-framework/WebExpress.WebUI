using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a read-only traffic light that visualizes a status by lighting one of its
    /// red, yellow or green lamps. It is purely a display control; to let the user pick a state
    /// use <see cref="ControlFormItemInputTrafficLight"/> instead.
    /// </summary>
    /// <remarks>
    /// The control only emits a host element carrying the state as data attributes. The lamps
    /// themselves are built by the client runtime (see webexpress.webui.traffic.light.js), which
    /// keeps the rendered markup small and lets the state be updated without a round trip.
    /// </remarks>
    public class ControlTrafficLight : Control
    {
        /// <summary>
        /// Gets or sets the lamp that is currently lit. Defaults to <see cref="TypeTrafficLight.Off"/>.
        /// </summary>
        public Func<IRenderControlContext, TypeTrafficLight> State { get; set; }

        /// <summary>
        /// Gets or sets how the lamps are arranged. Defaults to
        /// <see cref="TypeOrientationTrafficLight.Vertical"/>.
        /// </summary>
        public Func<IRenderControlContext, TypeOrientationTrafficLight> Orientation { get; set; }

        /// <summary>
        /// Gets or sets the size of the lamps. Defaults to the compact
        /// <see cref="TypeSizeTrafficLight.Default"/>.
        /// </summary>
        public Func<IRenderControlContext, TypeSizeTrafficLight> Size { get; set; }

        /// <summary>
        /// Gets or sets an optional tooltip describing what the current state means.
        /// </summary>
        public Func<IRenderControlContext, string> Tooltip { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTrafficLight(string id = null)
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
            var state = State?.Invoke(renderContext) ?? TypeTrafficLight.Off;
            var orientation = Orientation?.Invoke(renderContext) ?? TypeOrientationTrafficLight.Vertical;
            var size = Size?.Invoke(renderContext) ?? TypeSizeTrafficLight.Default;
            var tooltip = Tooltip?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-traffic-light", size.ToClass(), GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            }
                .AddUserAttribute("data-value", state.ToValue())
                // the vertical default is implied; only the non-default orientation is emitted
                .AddUserAttribute("data-orientation", orientation == TypeOrientationTrafficLight.Horizontal ? orientation.ToValue() : null)
                .AddUserAttribute("data-tooltip", I18N.Translate(renderContext, tooltip));

            return html;
        }
    }
}
