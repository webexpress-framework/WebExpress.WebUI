using System;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// One segment of a multi-segment progress bar, representing a portion of the whole.
    /// </summary>
    public class ControlMultipleProgressBarItem
    {
        /// <summary>
        /// Gets or sets the text color.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorText> Color { get; set; } = _ => new PropertyColorText(TypeColorText.Default);

        /// <summary>
        /// Gets or sets the background color.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackground> BackgroundColor { get; set; } = _ => new PropertyColorBackground(TypeColorBackground.Default);

        /// <summary>
        /// Gets or sets the value.
        /// </summary>
        public Func<IRenderControlContext, uint> Value { get; set; }

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }
    }
}
