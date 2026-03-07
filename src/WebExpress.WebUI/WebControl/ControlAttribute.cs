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
        /// Returns or sets the text color of the key.
        /// </summary>
        public PropertyColorText Color
        {
            get => (PropertyColorText)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
        }

        /// <summary>
        /// Returns or sets the text color of the key.
        /// </summary>
        public PropertyColorText KeyColor { get; set; }

        /// <summary>
        /// Returns or sets the icon associated with the attribute, typically 
        /// used to visually represent the attribute's meaning or category.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Returns or sets the key of the attribute, representing the name or 
        /// identifier in the key-value pair.
        /// </summary>
        public string Key { get; set; }

        /// <summary>
        /// Returns or sets the value.
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// Returns or sets a link.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Returns or sets the character used to separate the key and value in the displayed attribute.
        /// Common separators include ':' or '='.
        /// </summary>
        public char Separator { get; set; } = ':';

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
            return Render(renderContext, visualTree, Key, Value, Uri, Icon);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="key">The key of the attribute to be rendered.</param>
        /// <param name="value">The value of the attribute to be rendered.</param>
        /// <param name="uri">The URI to be associated with the value, making it a clickable link if provided.</param>
        /// <param name="icon">The icon to be displayed alongside the key-value pair, providing a visual representation of the attribute.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, string key, string value, IUri uri, IIcon icon)
        {
            if (!Enable)
            {
                return null;
            }

            var resultUri = uri?.BindParameters(renderContext.Request);
            key = I18N.Translate(renderContext.Request?.Culture, key);
            var separator = string.IsNullOrWhiteSpace(key) ? '\0' : Separator;
            var iconHtml = icon?.Render(renderContext, visualTree);

            var keyElement = new HtmlElementTextSemanticsSpan(new HtmlText(key + Separator))
            {
                Id = string.IsNullOrWhiteSpace(Id) ? string.Empty : $"{Id}_name",
                Class = KeyColor?.ToClass()
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
                Class = GetClasses(),
                Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                Role = Role
            };

            return html;
        }
    }
}
