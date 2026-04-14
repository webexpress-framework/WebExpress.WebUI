using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an item in a combobox control within a form.
    /// </summary>
    public class ControlFormItemInputComboItem : IControlFormItemInputComboItem
    {
        private readonly List<ControlFormItemInputComboItem> _subItems = [];

        /// <summary>
        /// Returns the sub-items of the combobox item.
        /// </summary>
        public IEnumerable<ControlFormItemInputComboItem> SubItems => _subItems;

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Gets or sets a value.
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// Gets or sets a tag value.
        /// </summary>
        public object Tag { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="subitems">The child entries.</param>
        public ControlFormItemInputComboItem(params ControlFormItemInputComboItem[] subitems)
        {
            _subItems.AddRange(subitems);
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="subitems">The child entries.</param>
        public ControlFormItemInputComboItem(IEnumerable<ControlFormItemInputComboItem> subitems)
            : this()
        {
            _subItems.AddRange(subitems);
        }
    }
}
