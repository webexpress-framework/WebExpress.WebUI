using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that renders a cell value as a traffic light within a table using a
    /// template. The cell value is expected to be one of the lamp tokens (red, yellow, green) or
    /// empty for off.
    /// </summary>
    public class ControlTableTemplateTrafficLight : IControlTableTemplateEditable
    {
        /// <summary>
        /// Gets or sets the unique identifier for the object.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the current template is editable or read-only.
        /// When editable, the cell renders an interactive traffic light input.
        /// </summary>
        public Func<IRenderControlContext, bool> Editable { get; set; }

        /// <summary>
        /// Gets or sets how the lamps are arranged. Defaults to
        /// <see cref="TypeOrientationTrafficLight.Vertical"/>; the horizontal layout fits the
        /// limited height of a table row better.
        /// </summary>
        public Func<IRenderControlContext, TypeOrientationTrafficLight> Orientation { get; set; }

        /// <summary>
        /// Gets or sets the size of the lamps. Defaults to the compact
        /// <see cref="TypeSizeTrafficLight.Default"/>.
        /// </summary>
        public Func<IRenderControlContext, TypeSizeTrafficLight> Size { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTableTemplateTrafficLight(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var editable = Editable?.Invoke(renderContext);
            var orientation = Orientation?.Invoke(renderContext) ?? TypeOrientationTrafficLight.Vertical;
            var size = Size?.Invoke(renderContext) ?? TypeSizeTrafficLight.Default;
            var sizeToken = size.ToValue();

            var html = new HtmlElement("template")
            {
                Id = Id
            }
                .AddUserAttribute("data-type", "traffic-light")
                .AddUserAttribute("data-orientation", orientation == TypeOrientationTrafficLight.Horizontal ? orientation.ToValue() : null)
                .AddUserAttribute("data-size", string.IsNullOrEmpty(sizeToken) ? null : sizeToken)
                .AddUserAttribute("data-editable", editable == true ? "true" : null);

            return html;
        }
    }
}
