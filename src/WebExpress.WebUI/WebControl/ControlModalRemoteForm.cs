using System.Linq;
using System.Runtime.CompilerServices;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A modal page dynamically retrieves and displays content from another page within 
    /// a modal dialog. This allows users to interact with external or additional information 
    /// without navigating away from the current view. Modal pages are ideal for loading details, 
    /// or dynamic content, providing a seamless and focused user experience while maintaining 
    /// the main application's context.
    /// </summary>
    public class ControlModalRemoteForm : ControlModalRemotePage
    {
        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        /// <param name="instance">The name of the calling member. This is automatically provided by the compiler.</param>
        /// <param name="file">The file path of the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="line">The line number in the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="content">The content of the html element.</param>
        public ControlModalRemoteForm([CallerMemberName] string instance = null, [CallerFilePath] string file = null, [CallerLineNumber] int? line = null, params IControl[] content)
            : this($"modal_{instance}_{file}_{line}".GetHashCode().ToString("X"), content)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The content of the html element.</param>
        public ControlModalRemoteForm(string id, params IControl[] content)
            : base(id, content)
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
            var header = new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(Header)))
            {
                Class = "wx-modal-header"
            };

            var content = new HtmlElementTextContentDiv([.. Content.Select(x => x.Render(renderContext, visualTree))])
            {
                Class = "wx-modal-content"
            };

            var footer = new HtmlElementTextContentDiv()
            {
                Class = "wx-modal-footer"
            };

            var html = new HtmlElementTextContentDiv(header, content, footer)
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-modal-form", GetClasses())
            }
            .AddUserAttribute("data-size", Size.ToClass())
            .AddUserAttribute("data-close-label", I18N.Translate(CloseLabel))
            .AddUserAttribute("data-uri", Uri?.ToString())
            .AddUserAttribute("data-selector", Selector);

            return html;
        }
    }
}
