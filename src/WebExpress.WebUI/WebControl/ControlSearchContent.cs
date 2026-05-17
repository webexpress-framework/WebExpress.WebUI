using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
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
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the icon displayed in the search control.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the content ID associated with the search control.
        /// </summary>
        public string[] TargetIds { get; set; }

        /// <summary>
        /// Gets or sets the highlight color used for matching search terms.
        /// </summary>
        public Func<IRenderControlContext, string> HighlightColor { get; set; }

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
            var placeholder = Placeholder?.Invoke(renderContext);
            var icon = Icon?.Invoke(renderContext);
            var image = Image?.Invoke(renderContext);
            var highlightColor = HighlightColor?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-search-content", GetClasses()),
                Style = GetStyles()
            }
                .AddUserAttribute("placeholder", I18N.Translate(renderContext, placeholder))
                .AddUserAttribute("data-target-ids", TargetIds is not null
                    ? string.Join(",", TargetIds)
                    : null)
                .AddUserAttribute("data-highlight-color", highlightColor)
                .AddUserAttribute("data-icon", icon is Icon iconClass ? iconClass.Class : null)
                .AddUserAttribute("data-image", image?.ToString() ?? (icon is ImageIcon imageIcon ? imageIcon.Uri?.ToString() : null));

            return html;
        }
    }
}
