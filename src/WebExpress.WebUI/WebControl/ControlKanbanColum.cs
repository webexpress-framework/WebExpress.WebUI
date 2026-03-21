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
        /// Returns the id of the control.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Returns the title associated with the column.
        /// </summary>
        public string Title { get; }

        /// <summary>
        /// Returns the size descriptor associated with the column.
        /// </summary>
        public string Size { get; }

        /// <summary>
        /// Initializes a new instance of class.
        /// </summary>
        /// <param name="id">The unique identifier for the column.</param>
        /// <param name="title">The title to be displayed for the column.</param>
        /// <param name="size">The size descriptor for the column (e.g., "33%", "*").</param>
        public ControlKanbanColumn(string id, string title, string size)
        {
            Id = id;
            Title = title;
            Size = size;
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
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Title))
                .AddUserAttribute("data-size", Size);

            return html;
        }
    }
}
