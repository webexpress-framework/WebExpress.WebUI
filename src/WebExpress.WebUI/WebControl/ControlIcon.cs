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
        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the title.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Return or specifies the vertical orientation.
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
                ? Css.Concatenate("wx-icon", GetClasses())
                : GetClasses();
            var role = Role?.Invoke(renderContext);

            var html = icon?.Render
            (
                renderContext,
                visualTree,
                Id,
                title,
                css,
                GetStyles(),
                role
            );

            return html;
        }
    }
}
