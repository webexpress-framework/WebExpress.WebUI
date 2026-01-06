using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a table cell in a control, including its attributes and content.
    /// </summary>
    /// <remarks>
    /// This class provides properties to define the cell's identifier, 
    /// CSS class, inline styles, and the content displayed within the cell. It 
    /// is typically used to represent and manipulate  individual cells in
    /// a table-like control.
    /// </remarks>
    public class ControlTableCell : IControlTableCell
    {
        /// <summary>
        /// Returns or sets the unique identifier for the entity.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Returns or sets the class or category associated with the current object.
        /// </summary>
        public virtual string Class { get; set; }

        /// <summary>
        /// Returns or sets the style applied to the element.
        /// </summary>
        public virtual string Style { get; set; }

        /// <summary>
        /// Returns or sets the color scheme used for the cell.
        /// </summary>
        public virtual TypeColorTable Color { get; set; } = TypeColorTable.Default;

        /// <summary>
        /// Returns or sets the icon associated with this instance.
        /// </summary>
        public virtual IIcon Icon { get; set; }

        /// <summary>
        /// Returns or sets the URI associated with the current resource.
        /// </summary>
        public virtual IUri Uri { get; set; }

        /// <summary>
        /// Returns or sets the target.
        /// </summary>
        public virtual TypeTarget Target { get; set; }

        /// <summary>
        /// Returns or sets the target of a modal dialogue.
        /// </summary>
        public virtual IModalTarget Modal { get; set; }

        /// <summary>
        /// Returns or sets the content associated with this cell.
        /// </summary>
        public virtual string Text { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">The unique identifier for the table cell. Cannot be null or empty.</param>
        public ControlTableCell(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Converts the cell to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv(new HtmlText(Text))
            {
                Id = Id,
                Class = Class,
                Style = Style
            }
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", (Icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color", Color.ToClass())
                .AddUserAttribute("data-uri", Uri?.ToString())
                .AddUserAttribute("data-target", Target.ToStringValue())
                .AddUserAttribute("data-modal", Modal?.Id);

            return html;
        }
    }
}
