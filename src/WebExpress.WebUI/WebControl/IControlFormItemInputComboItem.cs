using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an item in a combobox control within a form.
    /// </summary>
    public interface IControlFormItemInputComboItem
    {
        /// <summary>
        /// Returns the sub-items of the combobox item.
        /// </summary>
        IEnumerable<ControlFormItemInputComboItem> SubItems { get; }

        /// <summary>
        /// Returns the text.
        /// </summary>
        string Text { get; }

        /// <summary>
        /// Returns a value.
        /// </summary>
        string Value { get; }

        /// <summary>
        /// Returns a tag value.
        /// </summary>
        object Tag { get; }
    }
}
