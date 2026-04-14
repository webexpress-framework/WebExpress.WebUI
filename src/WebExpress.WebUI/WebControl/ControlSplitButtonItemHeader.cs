using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a header item in a split button control.
    /// </summary>
    public class ControlSplitButtonItemHeader : Control, IControlSplitButtonItem
    {
        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlSplitButtonItemHeader(string id = null)
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
            return new HtmlElementTextContentLi(new HtmlText(I18N.Translate(renderContext?.Request?.Culture, Text)))
            {
                Id = Id,
                Class = Css.Concatenate("dropdown-header", GetClasses()),
                Style = GetStyles(),
                Role = Role
            };
        }
    }
}
