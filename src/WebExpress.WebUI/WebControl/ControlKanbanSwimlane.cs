using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a swimlane in a kanban control.
    /// </summary>
    public sealed class ControlKanbanSwimlane : IControlKanbanSwimlane
    {
        /// <summary>
        /// Returns the id of the control.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Returns the title associated with the swimlane.
        /// </summary>
        public string Title { get; }

        /// <summary>
        /// Returns a value indicating whether the content is currently expanded.
        /// </summary>
        public bool Expanded { get; }

        /// <summary>
        /// Initializes a new instance of class.
        /// </summary>
        /// <param name="id">The unique identifier for the column.</param>
        /// <param name="title">The title to be displayed for the column.</param>
        /// <param name="expanded">
        /// A value indicating whether the column content is initially expanded.
        /// </param>
        public ControlKanbanSwimlane(string id, string title, bool expanded = true)
        {
            Id = id;
            Title = title;
            Expanded = expanded;
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
                Class = "wx-swimlane"
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Title))
                .AddUserAttribute("data-expanded", !Expanded ? "false" : null);

            return html;
        }
    }
}
