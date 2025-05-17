using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a table column control.
    /// </summary>
    public class ControlTableColumn : IControlTableColumn
    {
        /// <summary>
        /// Returns or sets the unique identifier for the entity.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Returns or sets the header text.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Returns or sets the icon.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Returns or sets the render function used for rendering the cells in the column.
        /// </summary>
        public string RenderScript { get; set; }

        /// <summary>
        /// Returns or sets the color scheme used for the column.
        /// </summary>
        public TypeTableColor Color { get; set; } = TypeTableColor.Default;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTableColumn(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Converts the column to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(renderContext, Title)))
            {
                Id = Id
            }
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", (Icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color", Color.ToClass())
                .AddUserAttribute("data-render", RenderScript);

            return html;
        }
    }
}
