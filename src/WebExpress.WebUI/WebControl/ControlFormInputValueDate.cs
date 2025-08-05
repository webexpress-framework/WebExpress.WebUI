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
        /// Returns the date.
        /// </summary>
        public DateTime? Date => From ?? To;

        /// <summary>
        /// Returns or sets the start date of the range.
        /// </summary>
        public DateTime? From { get; set; }

        /// <summary>
        /// Returns or sets the end date of the range.
        /// </summary>
        public DateTime? To { get; set; }

        /// <summary>
        /// Returns or sets the default format string used for output.
        /// </summary>
        public string Format { get; set; }

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
        public ControlFormInputValueDate(DateTime? value, string format = null)
        {
            From = value;
            To = null;
            Format = format;
        }

        /// <summary>
        /// Initializes a new instance with a date range.
        /// </summary>
        /// <param name="from">Start date of the range.</param>
        /// <param name="to">End date of the range.</param>
        /// <param name="format">Optional format string for output.</param>
        public ControlFormInputValueDate(DateTime? from, DateTime? to, string format = null)
        {
            From = from;
            To = to;
            Format = format;
        }

        /// <summary>
        /// Returns a string representation of the date using the specified format and culture.
        /// </summary>
        /// <param name="format">The format string (e.g. "yyyy-MM-dd").</param>
        /// <param name="formatProvider">The culture-specific formatting provider.</param>
        /// <returns>A formatted string representation of the date.</returns>
        public virtual string ToString(string format, IFormatProvider formatProvider)
        {
            var fmt = format ?? Format ?? "d";
            var culture = formatProvider ?? CultureInfo.CurrentCulture;

            if (From.HasValue && To.HasValue)
            {
                return $"{From.Value.ToString(fmt, culture)} – {To.Value.ToString(fmt, culture)}";
            }
            else if (From.HasValue)
            {
                return From.Value.ToString(fmt, culture);
            }
            else if (To.HasValue)
            {
                return To.Value.ToString(fmt, culture);
            }

            return string.Empty;
        }
    }
}
