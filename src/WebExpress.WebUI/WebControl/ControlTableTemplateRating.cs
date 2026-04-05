using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that renders a rating in a table using a template.
    /// </summary>
    public class ControlTableTemplateRating : IControlTableTemplateEditable
    {
        /// <summary>
        /// Returns or sets the unique identifier for the object.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Returns or sets a value indicating whether the current template is editable or read-only.
        /// </summary>
        public bool Editable { get; set; }

        /// <summary>
        /// Returns or sets the maximum rating value (stars) that can be assigned.
        /// </summary>
        public uint MaxRating { get; set; } = uint.MaxValue;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTableTemplateRating(string id = null)
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
                .AddUserAttribute("data-type", "rating")
                .AddUserAttribute("data-stars", MaxRating != uint.MaxValue ? MaxRating.ToString() : null)
                .AddUserAttribute("data-editable", Editable ? "true" : null);

            return html;
        }
    }
}
