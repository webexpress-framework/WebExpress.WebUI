using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a column in a control dashboard, including its display title 
    /// and size configuration.
    /// </summary>
    public sealed class ControlDashboardColumn : IControlDashboardColumn
    {
        /// <summary>
        /// Returns the id of the control.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Returns the title associated with the object.
        /// </summary>
        public string Title { get; }

        /// <summary>
        /// Returns the size descriptor associated with the object.
        /// </summary>
        public string Size { get; }

        /// <summary>
        /// Initializes a new instance of class.
        /// </summary>
        public ControlDashboardColumn(string title, string size)
        {
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
