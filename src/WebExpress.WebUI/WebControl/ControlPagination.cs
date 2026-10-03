using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a pagination control that allows navigation through pages of content.
    /// </summary>
    public class ControlPagination : Control
    {
        /// <summary>
        /// Gets or sets the number of pages.
        /// </summary>
        public Func<IRenderControlContext, uint> Total { get; set; }

        /// <summary>
        /// Gets or sets the current page.
        /// </summary>
        public Func<IRenderControlContext, uint> Page { get; set; }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public Func<IRenderControlContext, TypeSizePagination> Size
        {
            get => (Func<IRenderControlContext, TypeSizePagination>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlPagination(string id = null)
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
            var backgroundColor = BackgroundColor?.Invoke(renderContext);
            var borderColor = BorderColor?.Invoke(renderContext);
            var role = Role?.Invoke(renderContext);
            var page = Page?.Invoke(renderContext) ?? 0;
            var total = Total?.Invoke(renderContext) ?? 0;

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-pagination", Css.Remove(GetClasses(renderContext), backgroundColor?.ToClass(), borderColor?.ToClass())),
                Style = Style.Remove(GetStyles(renderContext), backgroundColor.ToStyle()),
                Role = role
            }
                .AddUserAttribute("data-page", page > 0 ? page.ToString() : null)
                .AddUserAttribute("data-total", total > 0 ? total.ToString() : null);

            return html;
        }
    }
}
