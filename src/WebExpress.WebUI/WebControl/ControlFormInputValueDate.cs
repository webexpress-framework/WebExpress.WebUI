using System;
using System.Globalization;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form input value of type <see cref="DateTime"/>.
    /// Provides formatting, validation, and raw access.
    /// </summary>
    public class ControlFormInputValueDate : IControlFormInputValue
    {
        /// <summary>
        /// Gets or sets the date.
        /// </summary>
        public DateTime? Date { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormInputValueDate()
        {
        }

        /// <summary>
        /// Initializes a new instance with a single date.
        /// </summary>
        /// <param name="value">The single date value.</param>
        /// <param name="format">Optional format string for output.</param>
        public ControlFormInputValueDate(DateTime? value)
        {
            Date = value;
        }

        /// <summary>
        /// Initializes a new instance from a string representation.
        /// </summary>
        /// <param name="value">String with either one date or two dates separated by '-'.</param>
        /// <param name="formatProvider">The culture-specific formatting provider.</param>
        public ControlFormInputValueDate(string value, IFormatProvider formatProvider)
        {
            // parse the string, expecting either one date or a range separated by '-'
            if (string.IsNullOrWhiteSpace(value))
            {
                Date = null;
                return;
            }

            // try parse with current culture, fallback to invariant
            if (DateTime.TryParse(value, formatProvider, DateTimeStyles.None, out var dt))
            {
                Date = dt;
            }

            if (DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out dt))
            {
                Date = dt;
            }
        }

        /// <summary>
        /// Returns a string representation of the date using the specified format and culture.
        /// </summary>
        /// <param name="format">The format string (e.g. "yyyy-MM-dd").</param>
        /// <param name="formatProvider">The culture-specific formatting provider.</param>
        /// <returns>A formatted string representation of the date.</returns>
        public virtual string ToString(string format, IFormatProvider formatProvider)
        {
            var fmt = format ?? "d";
            var culture = formatProvider ?? CultureInfo.CurrentCulture;

            if (Date.HasValue)
            {
                return Date.Value.ToString(fmt, culture);
            }

            return string.Empty;
        }
    }
}
