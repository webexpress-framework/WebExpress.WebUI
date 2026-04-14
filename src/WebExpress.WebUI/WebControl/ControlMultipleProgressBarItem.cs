namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an item in a multiple progress bar control.
    /// </summary>
    public class ControlMultipleProgressBarItem
    {
        /// <summary>
        /// Gets or sets the text color.
        /// </summary>
        public PropertyColorText Color { get; set; } = new PropertyColorText(TypeColorText.Default);

        /// <summary>
        /// Gets or sets the background color.
        /// </summary>
        public PropertyColorBackground BackgroundColor { get; set; } = new PropertyColorBackground(TypeColorBackground.Default);

        /// <summary>
        /// Gets or sets the value.
        /// </summary>
        public uint Value { get; set; }

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public string Text { get; set; }
    }
}
