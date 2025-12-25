using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a message queue control that displays messages with customizable 
    /// appearance and behavior.
    /// </summary>
    public class ControlMessageQueue : Control
    {
        /// <summary>
        /// Returns or sets the URI associated with the resource.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlMessageQueue(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-message-queue", GetClasses()),
                Style = GetStyles(),
                Role = "status"
            }
                .AddUserAttribute("data-uri", Uri?.ToString());
        }
    }
}
