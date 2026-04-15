using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control line that can be used as a split button item or a dropdown item.
    /// </summary>
    public class ControlLine : Control, IControlSplitButtonItem, IControlDropdownItem
    {
        /// <summary>
        /// Gets or set the background color.
        /// </summary>
        public new PropertyColorBackground BackgroundColor { get; private set; }

        /// <summary>
        /// Gets or sets the color.
        /// </summary>
        public PropertyColorLine Color
        {
            get => (PropertyColorLine)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlLine(string id = null)
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
            var html = new HtmlElementTextContentHr()
            {
                Id = Id,
                Class = GetClasses(),
                Style = GetStyles(),
                Role = Role
            };

            return html;
        }
    }
}
