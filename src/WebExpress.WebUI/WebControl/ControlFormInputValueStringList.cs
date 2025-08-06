using System;
using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form input value that stores a list of strings separated by semicolons.
    /// </summary>
    public class ControlFormInputValueStringList : IControlFormInputValue
    {
        private readonly List<string> _items = [];

        /// <summary>
        /// Returns or sets the list of strings.
        /// </summary>
        public IEnumerable<string> Items => _items;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormInputValueStringList()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class with a semicolon separated string.
        /// </summary>
        /// <param name="value">Semicolon separated string.</param>
        public ControlFormInputValueStringList(string value)
        {
            // split the input string by semicolon and trim each item
            _items.AddRange
            (
                string.IsNullOrEmpty(value)
                    ? new List<string>()
                    : value.Split(';').Select(x => x.Trim()).Where(x => !string.IsNullOrEmpty(x)).ToList()
            );
        }

        /// <summary>
        /// Initializes a new instance of the class with a list of strings.
        /// </summary>
        /// <param name="items">List of strings.</param>
        public ControlFormInputValueStringList(params string[] items)
        {
            // assign items list, ignore null or empty items
            _items.AddRange(items?.Where(x => !string.IsNullOrEmpty(x)).Select(x => x.Trim()) ?? []);
        }

        /// <summary>
        /// Initializes a new instance of the class with a list of strings.
        /// </summary>
        /// <param name="items">List of strings.</param>
        public ControlFormInputValueStringList(IEnumerable<string> items)
        {
            // assign items list, ignore null or empty items
            _items.AddRange(items?.Where(x => !string.IsNullOrEmpty(x)).Select(x => x.Trim()) ?? []);
        }

        /// <summary>
        /// Adds items to the list.
        /// </summary>
        /// <param name="items">Strings to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlFormInputValueStringList Add(params string[] items)
        {
            // add non-empty and trimmed items to the list
            _items.AddRange(items?.Where(x => !string.IsNullOrEmpty(x)).Select(x => x.Trim()) ?? []);
            return this;
        }

        /// <summary>
        /// Removes an item from the list.
        /// </summary>
        /// <param name="item">String to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlFormInputValueStringList Remove(string item)
        {
            // remove item if it exists (trim before compare)
            _items.RemoveAll(x => x.Equals(item?.Trim(), StringComparison.Ordinal));
            return this;
        }

        /// <summary>
        /// Returns a semicolon separated string representation of the list.
        /// </summary>
        /// <param name="format">Ignored for string list.</param>
        /// <param name="formatProvider">Ignored for string list.</param>
        /// <returns>Semicolon separated string.</returns>
        public virtual string ToString(string format, IFormatProvider formatProvider)
        {
            // join all items with semicolon
            return _items != null && _items.Count != 0
                ? string.Join("; ", _items)
                : string.Empty;
        }
    }
}
