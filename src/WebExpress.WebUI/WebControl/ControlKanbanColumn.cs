using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a column in a kanban control, including its display title 
    /// and size configuration.
    /// </summary>
    public sealed class ControlKanbanColumn : IControlKanbanColumn
    {
        /// <summary>
        /// Gets the id of the control.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets the title associated with the column.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; }

        /// <summary>
        /// Gets the size descriptor associated with the column.
        /// </summary>
        public Func<IRenderControlContext, string> Size { get; }

        /// <summary>
        /// Initializes a new instance of class.
        /// </summary>
        /// <param name="id">The unique identifier for the column.</param>
        /// <param name="title">The title to be displayed for the column.</param>
        /// <param name="size">The column width as a weight relative to the other columns (e.g. "1fr",
        /// "2fr"); a percentage, "*" or "auto" is converted in proportion, so the columns always
        /// share the row instead of running past its edge.</param>
        public ControlKanbanColumn(string id, string title, string size)
        {
            Id = id;
            Title = _ => title;
            Size = _ => size;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-column"
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Title?.Invoke(renderContext)))
                .AddUserAttribute("data-size", Size?.Invoke(renderContext));

            return html;
        }
    }
}
