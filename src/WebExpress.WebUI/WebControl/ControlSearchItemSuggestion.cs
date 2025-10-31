using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a suggestion item for the search control.
    /// </summary>
    public class ControlSearchItemSuggestion
    {
        /// <summary>
        /// Returns the unique identifier for the suggestion item.
        /// </summary>
        public string Id { get; }

        /// <summary>
        /// Returns or sets the label text for the suggestion item.
        /// </summary>
        public string Label { get; set; }

        /// <summary>
        /// Returns or sets the icon associated with the suggestion item.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Returns or sets the CSS class for styling the suggestion item.
        /// </summary>
        public string Css { get; set; }

        /// <summary>
        /// Returns or sets a value indicating whether the suggestion item is marked as a favorite.
        /// </summary>
        public bool Favorited { get; set; }

        /// <summary>
        /// Gets or sets the value associated with the suggestion item.
        /// </summary>
        public object Value { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The content of the html element.</param>
        public ControlSearchItemSuggestion(string id = null)
        {
            Id = id;
        }
    }
}
