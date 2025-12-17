using System.Collections.Generic;
using System.Text.Json.Serialization;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an item in a control cascading.
    /// </summary>
    public interface IControlFormItemInputCascadingItem : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Returns or sets the label of the selection item.
        /// </summary>
        string Text { get; }

        /// <summary>
        /// Returns or sets the icon associated with the selection item.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Returns or sets the color of the label.
        /// </summary>
        TypeColorSelection LabelColor { get; }

        /// <summary>
        /// Returns or sets a value indicating whether the selection item is disabled.
        /// </summary>
        [JsonPropertyName("disabled")]
        bool Disabled { get; }

        /// <summary>
        /// Returns or sets the content of the selection item.
        /// </summary>
        public IControl Content { get; set; }

        /// <summary>
        /// Returns the child cascading items.
        /// </summary>
        IEnumerable<IControlFormItemInputCascadingItem> Children { get; }

        /// <summary>
        /// Adds the specified children to the cascading node.
        /// </summary>
        /// <param name="children">The children to add.</param>
        /// <returns>The current instance, allowing for method chaining.</returns>
        IControlFormItemInputCascadingItem Add(params IControlFormItemInputCascadingItem[] children);

        /// <summary>
        /// Adds the specified children to the cascading node.
        /// </summary>
        /// <param name="children">The children to add.</param>
        /// <returns>The current instance, allowing for method chaining.</returns>
        IControlFormItemInputCascadingItem Add(IEnumerable<IControlFormItemInputCascadingItem> children);

        /// <summary>
        /// Removes the specified content or child cascading item from the cascading item.
        /// </summary>
        /// <param name="child">The content or child cascading item to remove.</param>
        /// <returns>The current instance, allowing for method chaining.</returns>
        IControlFormItemInputCascadingItem Remove(IControlFormItemInputCascadingItem child);
    }
}
