using System.Text.Json.Serialization;
using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an item in a selection input form.
    /// </summary>
    public class ControlFormItemInputSelectionItem
    {
        /// <summary>
        /// Gets the unique identifier of the selection item.
        /// </summary>
        [JsonPropertyName("id")]
        public string Id { get; }

        /// <summary>
        /// Gets or sets the label of the selection item.
        /// </summary>
        [JsonPropertyName("label")]
        public string Label { get; set; }

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
        /// Gets or sets a value indicating whether the selection item is selected.
        /// </summary>
        [JsonPropertyName("selected")]
        public bool Selected { get; set; }

        /// <summary>
        /// Returns or sets a value indicating whether the selection item is disabled.
        /// </summary>
        [JsonPropertyName("disabled")]
        public bool Disabled { get; set; }

        /// <summary>
        /// Gets or sets the content of the selection item.
        /// </summary>
        public IControl Content { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="ControlFormItemInputSelectionItem"/> class.
        /// </summary>
        /// <param name="id">The unique identifier of the selection item. Optional.</param>
        public ControlFormItemInputSelectionItem(string id = null)
        {
            Id = id;
        }
    }
}
