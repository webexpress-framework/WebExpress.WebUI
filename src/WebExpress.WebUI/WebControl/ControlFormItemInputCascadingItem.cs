using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a cascading node for the <see cref="ControlFormItemInputCascading"/>.
    /// </summary>
    public class ControlFormItemInputCascadingItem : IControlFormItemInputCascadingItem
    {
        private readonly List<IControlFormItemInputCascadingItem> _children = [];

        /// <summary>
        /// Returns the unique identifier of the selection item.
        /// </summary>
        [JsonPropertyName("id")]
        public string Id { get; }

        /// <summary>
        /// Gets or sets the label of the selection item.
        /// </summary>
        [JsonPropertyName("label")]
        public string Text { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with the selection item.
        /// </summary>
        [JsonPropertyName("icon")]
        public IIcon Icon { get; set; }

        /// <summary>
        /// Gets or sets the color of the label.
        /// </summary>
        [JsonPropertyName("labelcolor")]
        public TypeColorSelection LabelColor { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the selection item is disabled.
        /// </summary>
        [JsonPropertyName("disabled")]
        public bool Disabled { get; set; }

        /// <summary>
        /// Gets or sets the content of the selection item.
        /// </summary>
        public IControl Content { get; set; }

        /// <summary>
        /// Returns the child cascading items.
        /// </summary>
        public IEnumerable<IControlFormItemInputCascadingItem> Children => _children;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The unique identifier of the cascading node.</param>
        /// <param name="children">The children of the cascading node.</param>
        public ControlFormItemInputCascadingItem(string id = null, params IControlFormItemInputCascadingItem[] children)
        {
            Id = id;
            _children.AddRange(children);
        }

        /// <summary>
        /// Adds the specified children to the cascading node.
        /// </summary>
        /// <param name="children">The children to add.</param>
        /// <returns>The current instance, allowing for method chaining.</returns>
        public IControlFormItemInputCascadingItem Add(params IControlFormItemInputCascadingItem[] children)
        {
            _children.AddRange(children);

            return this;
        }

        /// <summary>
        /// Adds the specified children to the cascading node.
        /// </summary>
        /// <param name="children">The children to add.</param>
        /// <returns>The current instance, allowing for method chaining.</returns>
        public IControlFormItemInputCascadingItem Add(IEnumerable<IControlFormItemInputCascadingItem> children)
        {
            _children.AddRange(children);

            return this;
        }

        /// <summary>
        /// Removes the specified content or child cascading item from the cascading item.
        /// </summary>
        /// <param name="child">The content or child cascading item to remove.</param>
        /// <returns>The current instance, allowing for method chaining.</returns>
        public IControlFormItemInputCascadingItem Remove(IControlFormItemInputCascadingItem child)
        {
            _children.Remove(child);

            return this;
        }

        /// <summary>
        /// Converts the cell to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-cascading-item"),
            }
                .AddUserAttribute("data-label", I18N.Translate(Text))
                .AddUserAttribute("data-icon", Icon is Icon ? (Icon as Icon).Class : null)
                .AddUserAttribute("data-image", Icon is ImageIcon
                    ? (Icon as ImageIcon).Uri?.ToString()
                    : null)
                .AddUserAttribute("data-label-color", LabelColor != TypeColorSelection.Default
                    ? LabelColor.ToClass()
                    : null)
                .Add(Children.Select(x => x.Render(renderContext, visualTree)))
                .Add(Content?.Render(renderContext, visualTree));

            if (Disabled)
            {
                html.AddUserAttribute("disabled");
            }

            return html;
        }
    }
}
