using System.Text.Json.Serialization;
using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an item in a move input form.
    /// </summary>
    public class ControlFormItemInputMoveItem
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
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The unique identifier of the selection item. Optional.</param>
        public ControlFormItemInputMoveItem(string id = null)
        {
            Id = id;
        }
    }
}
