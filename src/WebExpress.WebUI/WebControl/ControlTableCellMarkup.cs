using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A table cell that shows formatted text - emphasis, links, code - instead of a plain
    /// value. The table sorts and filters it by its text, so the formatting is only how the
    /// value looks, never what it is compared by.
    /// </summary>
    public class ControlTableCellMarkup : IControlTableCell
    {
        /// <summary>
        /// Gets or sets the unique identifier for the entity.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets the css class of the cell.
        /// </summary>
        public virtual Func<IRenderControlContext, string> Class { get; set; }

        /// <summary>
        /// Gets or sets the css style of the cell.
        /// </summary>
        public virtual Func<IRenderControlContext, string> Style { get; set; }

        /// <summary>
        /// Gets or sets the color scheme used for the cell.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeColorTable> Color { get; set; } = _ => TypeColorTable.Default;

        /// <summary>
        /// Gets or sets the formatted content. It is expected to be phrasing content -
        /// text and inline elements - because the cell sets it on one line.
        /// </summary>
        public Func<IRenderControlContext, IHtmlNode> Content { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the cell.</param>
        public ControlTableCellMarkup(string id = null)
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
            var text = TableInlineText.Create(Content?.Invoke(renderContext), "wx-table-cell-text");

            // the marker tells the table control to keep the markup of this cell instead of
            // flattening it into cell text
            return new HtmlElementTextContentDiv(text)
            {
                Id = Id,
                Class = Css.Concatenate("wx-table-cell-markup", Class?.Invoke(renderContext)),
                Style = Style?.Invoke(renderContext)
            }
                .AddUserAttribute("data-color", (Color?.Invoke(renderContext) ?? TypeColorTable.Default).ToClass());
        }
    }
}
