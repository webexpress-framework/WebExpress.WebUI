using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a table column that is associated with a control template, defining the 
    /// visual structure and behavior of the control.
    /// </summary>
    public class ControlTableColumnTemplate : ControlTableColumn
    {
        private IControlTableTemplate _template;

        /// <summary>
        /// Returns the control template that defines the visual structure and behavior of the control.
        /// </summary>
        public IControlTableTemplate Template => _template;

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">The unique identifier for the table columns.</param>
        /// <param name="template">
        /// The control template to associate with the column.
        /// </param>
        public ControlTableColumnTemplate(string id = null, IControlTableTemplate template = null)
            : base(id)
        {
            _template = template;
        }

        /// <summary>
        /// Adds the specified control template to the current column template.
        /// </summary>
        /// <param name="template">
        /// The control template to associate with the column.
        /// </param>
        /// <returns>
        /// The current instance, allowing for method chaining.
        /// </returns>
        public ControlTableColumnTemplate Add(IControlTableTemplate template)
        {
            _template = template;

            return this;
        }

        /// <summary>
        /// Converts the cell to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Title))
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", (Icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color", Color.ToClass())
                .Add(_template?.Render(renderContext, visualTree));

            return html;
        }
    }
}
