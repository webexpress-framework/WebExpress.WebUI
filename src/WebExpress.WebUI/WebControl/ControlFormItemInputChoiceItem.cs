using System;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a single option of a <see cref="ControlFormItemInputChoice"/>.
    /// </summary>
    public class ControlFormItemInputChoiceItem
    {
        /// <summary>
        /// Gets or sets the label of the option.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the value the option submits.
        /// </summary>
        public Func<IRenderControlContext, string> Value { get; set; }

        /// <summary>
        /// Gets or sets the longer description of the option, shown as its tooltip.
        /// </summary>
        public Func<IRenderControlContext, string> Description { get; set; }

        /// <summary>
        /// Gets or sets the accent colour of the option, rendered as a dot in front
        /// of its label.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorTile> Color { get; set; }

        /// <summary>
        /// Gets or sets the value the option is filtered by. When the control names a
        /// <see cref="ControlFormItemInputChoice.FilterSource"/>, only the options whose
        /// value matches the value of that input remain visible.
        /// </summary>
        public Func<IRenderControlContext, string> FilterValue { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormItemInputChoiceItem()
        {
        }
    }
}
