using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that displays an icon.
    /// </summary>
    public class ControlIcon : Control
    {
        private Func<IRenderControlContext, PropertyColorBackground> _backgroundColor;

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the title.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets the colour behind the icon.
        /// </summary>
        /// <remarks>
        /// Held separately from the other properties instead of going through
        /// <c>SetProperty</c>, because it must not reach the icon element: a drawn icon is
        /// painted by masking <c>background-color</c>, so a background set there replaces
        /// the glyph's own colour rather than sitting behind it. It is applied to a wrapper
        /// at render time instead.
        /// </remarks>
        public override Func<IRenderControlContext, PropertyColorBackground> BackgroundColor
        {
            get => _backgroundColor;
            set => _backgroundColor = value;
        }

        /// <summary>
        /// Return or specifies the vertical orientation.
        /// </summary>
        public Func<IRenderControlContext, TypeVerticalAlignment> VerticalAlignment
        {
            get => (Func<IRenderControlContext, TypeVerticalAlignment>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public Func<IRenderControlContext, PropertySizeText> Size
        {
            get => (Func<IRenderControlContext, PropertySizeText>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass(), (renderContext) => value?.Invoke(renderContext)?.ToStyle());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlIcon(string id = null)
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
            var icon = Icon?.Invoke(renderContext);
            var title = Title?.Invoke(renderContext);
            var css = icon is ImageIcon
                ? Css.Concatenate("wx-icon", GetClasses(renderContext))
                : GetClasses(renderContext);
            var role = Role?.Invoke(renderContext);

            var html = icon?.Render
            (
                renderContext,
                visualTree,
                Id,
                title,
                css,
                GetStyles(renderContext),
                role
            );

            var background = _backgroundColor?.Invoke(renderContext);
            var backgroundClass = background?.ToClass();
            var backgroundStyle = background?.ToStyle();

            // every control is seeded with the default background, which paints nothing -
            // reacting to that would put a wrapper around every icon in the framework
            if (html is null || (string.IsNullOrWhiteSpace(backgroundClass) && string.IsNullOrWhiteSpace(backgroundStyle)))
            {
                return html;
            }

            return new HtmlElementTextSemanticsSpan(html)
            {
                Class = Css.Concatenate("wx-icon-backdrop", backgroundClass),
                Style = backgroundStyle
            };
        }
    }
}
