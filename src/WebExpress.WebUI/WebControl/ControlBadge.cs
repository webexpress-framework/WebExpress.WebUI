using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a badge control that can display a numerical indicator.
    /// </summary>
    public class ControlBadge : Control
    {
        /// <summary>
        /// Returns or set the background color.
        /// </summary>
        public new PropertyColorBackgroundBadge BackgroundColor
        {
            get => (PropertyColorBackgroundBadge)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
        }

        /// <summary>
        /// Return or specifies whether rounded corners should be used.
        /// </summary>
        public TypePillBadge Pill
        {
            get => (TypePillBadge)GetProperty(TypePillBadge.None);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets the target uri.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Returns or sets the value.
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// Return or specifies the vertical orientation..
        /// </summary>
        public TypeVerticalAlignment VerticalAlignment
        {
            get => (TypeVerticalAlignment)GetProperty(TypeVerticalAlignment.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets the size.
        /// </summary>
        public PropertySizeText Size
        {
            get => (PropertySizeText)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlBadge(string id = null)
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
            if (Uri != null)
            {
                return new HtmlElementTextSemanticsA(new HtmlText(Value))
                {
                    Id = Id,
                    Class = Css.Concatenate("badge", GetClasses()),
                    Style = GetStyles(),
                    Href = Uri.ToString(),
                    Role = Role
                };
            }

            return new HtmlElementTextSemanticsSpan(new HtmlText(Value))
            {
                Id = Id,
                Class = Css.Concatenate("badge", GetClasses()),
                Style = GetStyles(),
                Role = Role
            };
        }
    }
}
