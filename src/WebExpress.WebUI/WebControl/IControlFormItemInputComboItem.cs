using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an item in a combobox control within a form.
    /// </summary>
    public interface IControlFormItemInputComboItem
    {
        /// <summary>
        /// Gets the sub-items of the combobox item.
        /// </summary>
        IEnumerable<ControlFormItemInputComboItem> SubItems { get; }

        /// <summary>
        /// Gets the text.
        /// </summary>
        string Text { get; }

        /// <summary>
        /// Gets a value.
        /// </summary>
        string Value { get; }

        /// <summary>
        /// Gets a tag value.
        /// </summary>
        object Tag { get; }
    }
}
