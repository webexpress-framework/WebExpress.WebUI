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
        public uint Total { get; set; }

        /// <summary>
        /// Gets or sets the current page.
        /// </summary>
        public uint Page { get; set; }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public TypeSizePagination Size
        {
            get => (TypeSizePagination)GetProperty(TypeSizePagination.Default);
            set => SetProperty(value, () => value.ToClass());
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
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-pagination", Css.Remove(GetClasses(), BackgroundColor?.ToClass(), BorderColor?.ToClass())),
                Style = Style.Remove(GetStyles(), BackgroundColor.ToStyle()),
                Role = Role
            }
                .AddUserAttribute("data-page", Page > 0 ? Page.ToString() : null)
                .AddUserAttribute("data-total", Total > 0 ? Total.ToString() : null);

            return html;
        }
    }
}
