using System;
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
        public new Func<IRenderControlContext, PropertyColorBackgroundBadge> BackgroundColor
        {
            get => (Func<IRenderControlContext, PropertyColorBackgroundBadge>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null)?.ToClass(), () => value?.Invoke(null)?.ToStyle());
        }

        /// <summary>
        /// Return or specifies whether rounded corners should be used.
        /// </summary>
        public Func<IRenderControlContext, TypePillBadge> Pill
        {
            get => (Func<IRenderControlContext, TypePillBadge>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the target uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the value.
        /// </summary>
        public Func<IRenderControlContext, string> Value { get; set; }

        /// <summary>
        /// Return or specifies the vertical orientation..
        /// </summary>
        public Func<IRenderControlContext, TypeVerticalAlignment> VerticalAlignment
        {
            get => (Func<IRenderControlContext, TypeVerticalAlignment>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public Func<IRenderControlContext, PropertySizeText> Size
        {
            get => (Func<IRenderControlContext, PropertySizeText>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null)?.ToClass(), () => value?.Invoke(null)?.ToStyle());
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
            var role = Role?.Invoke(renderContext);
            var value = Value?.Invoke(renderContext);
            var uri = Uri?.Invoke(renderContext);

            if (uri is not null)
            {
                return new HtmlElementTextSemanticsA(new HtmlText(value))
                {
                    Id = Id,
                    Class = Css.Concatenate("badge link", GetClasses()),
                    Style = GetStyles(),
                    Href = uri?.ToString(),
                    Role = role
                };
            }

            return new HtmlElementTextSemanticsSpan(new HtmlText(value))
            {
                Id = Id,
                Class = Css.Concatenate("badge", GetClasses()),
                Style = GetStyles(),
                Role = role
            };
        }
    }
}
