using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A non-clickable heading within a navigation bar, used to label a group of entries.
    /// </summary>
    public class ControlNavigationItemHeader : Control, IControlNavigationItem
    {
        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlNavigationItemHeader(string id = null)
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
            var role = Role?.Invoke(renderContext);
            var text = Text?.Invoke(renderContext);

            return new HtmlElementTextContentLi(new HtmlText(I18N.Translate(renderContext.Request?.Culture, text)))
            {
                Id = Id,
                Class = Css.Concatenate("dropdown-header", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = role
            };
        }
    }
}
