using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that renders a markdown value in a table using a
    /// template. The cell value is interpreted as a markdown subset (headings,
    /// emphasis, code, links and lists) and rendered as rich text on the
    /// client. The renderer escapes the raw value before it rewrites the
    /// markup, so markdown data cannot inject HTML; content that is authored
    /// as HTML belongs in the <see cref="ControlTableTemplateHtml"/> template
    /// instead. The template is read-only.
    /// </summary>
    public class ControlTableTemplateMarkdown : IControlTableTemplate
    {
        /// <summary>
        /// Gets or sets the unique identifier for the object.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTableTemplateMarkdown(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElement("template")
            {
                Id = Id
            }
                .AddUserAttribute("data-type", "markdown");

            return html;
        }
    }
}
