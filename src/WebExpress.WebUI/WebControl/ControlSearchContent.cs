using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a search control.
    /// </summary>
    public class ControlSearchContent : Control
    {
        /// <summary>
        /// Gets or sets the placeholder text displayed in the search input.
        /// </summary>
        public string Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the icon displayed in the search control.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Gets or sets the content ID associated with the search control.
        /// </summary>
        public string[] TargetIds { get; set; }

        /// <summary>
        /// Gets or sets the highlight color used for matching search terms.
        /// </summary>
        public string HighlightColor { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="ControlSearch"/> class.
        /// </summary>
        /// <param name="id">The ID of the control.</param>
        public ControlSearchContent(string id = null)
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
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-search-content", GetClasses()),
                Style = GetStyles()
            }
                .AddUserAttribute("placeholder", I18N.Translate(renderContext, Placeholder))
                .AddUserAttribute("data-target-ids", TargetIds is not null
                    ? string.Join(",", TargetIds)
                    : null)
                .AddUserAttribute("data-highlight-color", HighlightColor)
                .AddUserAttribute("data-icon", Icon is Icon icon ? icon.Class : null)
                .AddUserAttribute("data-image", Icon is ImageIcon image ? image.Uri?.ToString() : null);

            return html;
        }
    }
}
