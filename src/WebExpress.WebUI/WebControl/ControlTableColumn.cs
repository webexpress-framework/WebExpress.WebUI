using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
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
        /// Gets or sets the unique identifier for the entity.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets the header text.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the color scheme used for the column.
        /// </summary>
        public Func<IRenderControlContext, TypeColorTable> Color { get; set; } = _ => TypeColorTable.Default;

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
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Title?.Invoke(renderContext)))
                .AddUserAttribute("data-icon", (Icon?.Invoke(renderContext) as Icon)?.Class)
                .AddUserAttribute("data-image", Image?.Invoke(renderContext)?.ToString() ?? (Icon?.Invoke(renderContext) as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color", (Color?.Invoke(renderContext) ?? TypeColorTable.Default).ToClass());

            return html;
        }
    }
}
