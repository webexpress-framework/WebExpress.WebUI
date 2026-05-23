using System;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control attribute with a name-value pair.
    /// </summary>
    public class ControlAttribute : Control
    {
        /// <summary>
        /// Gets or sets the text color of the key.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorText> Color
        {
            get => (Func<IRenderControlContext, PropertyColorText>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass(), (renderContext) => value?.Invoke(renderContext)?.ToStyle());
        }

        /// <summary>
        /// Gets or sets the text color of the key.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorText> KeyColor { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with the attribute, typically 
        /// used to visually represent the attribute's meaning or category.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the key of the attribute, representing the name or 
        /// identifier in the key-value pair.
        /// </summary>
        public Func<IRenderControlContext, string> Key { get; set; }

        /// <summary>
        /// Gets or sets the value.
        /// </summary>
        public Func<IRenderControlContext, string> Value { get; set; }

        /// <summary>
        /// Gets or sets a link.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the character used to separate the key and value in the displayed attribute.
        /// Common separators include ':' or '='.
        /// </summary>
        public Func<IRenderControlContext, char> Separator { get; set; } = _ => ':';

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlAttribute(string id = null)
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
            var enable = Enable?.Invoke(renderContext) ?? true;
            var uri = Uri?.Invoke(renderContext);
            var key = Key?.Invoke(renderContext);
            var icon = Icon?.Invoke(renderContext);
            var value = Value?.Invoke(renderContext);
            var keyColor = KeyColor?.Invoke(renderContext);
            var separator = Separator?.Invoke(renderContext) ?? ':';
            var role = Role?.Invoke(renderContext);

            if (!enable)
            {
                return null;
            }

            var resultUri = uri?.BindParameters(renderContext.Request);
            key = I18N.Translate(renderContext.Request?.Culture, key);
            var iconHtml = icon?.Render(renderContext, visualTree);

            var keyElement = new HtmlElementTextSemanticsSpan(new HtmlText(key + separator))
            {
                Id = string.IsNullOrWhiteSpace(Id) ? string.Empty : $"{Id}_name",
                Class = keyColor?.ToClass()
            };

            var valueElement = new HtmlElementTextSemanticsSpan(new HtmlText(I18N.Translate(renderContext.Request?.Culture, value)))
            {
                Id = string.IsNullOrWhiteSpace(Id) ? string.Empty : $"{Id}_value"
            };

            var html = new HtmlElementTextContentDiv
            (
                Icon is not null ? iconHtml : null,
                keyElement,
                resultUri is not null
                    ? new HtmlElementTextSemanticsA(valueElement)
                    {
                        Href = resultUri.ToString(),
                        Class = "wx-link"
                    }
                    : valueElement
            )
            {
                Id = Id,
                Class = GetClasses(renderContext),
                Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                Role = role
            };

            return html;
        }
    }
}
