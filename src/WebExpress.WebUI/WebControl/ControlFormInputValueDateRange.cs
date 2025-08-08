using System;
using System.Globalization;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form input range of type <see cref="DateTime"/>.
    /// </summary>
    public class ControlFormInputValueDateRange : IControlFormInputValue
    {
        /// <summary>
        /// Returns or sets the start date of the range.
        /// </summary>
        public DateTime? From { get; set; }

        /// <summary>
        /// Returns or sets the end date of the range.
        /// </summary>
        public DateTime? To { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormInputValueDateRange()
        {
        }

        /// <summary>
        /// Initializes a new instance with a single date.
        /// </summary>
        /// <param name="value">The single date value.</param>
        public ControlFormInputValueDateRange(DateTime? value)
        {
            From = value;
            To = null;
        }

        /// <summary>
        /// Initializes a new instance with a date range.
        /// </summary>
        /// <param name="from">Start date of the range.</param>
        /// <param name="to">End date of the range.</param>
        public ControlFormInputValueDateRange(DateTime? from, DateTime? to)
        {
            From = from;
            To = to;
        }

        /// <summary>
        /// Initializes a new instance from a string representation.
        /// </summary>
        /// <param name="value">String with either one date or two dates separated by '-'.</param>
        /// <param name="formatProvider">The culture-specific formatting provider.</param>
        public ControlFormInputValueDateRange(string value, IFormatProvider formatProvider)
        {
            // parse the string, expecting either one date or a range separated by '-'
            if (string.IsNullOrWhiteSpace(value))
            {
                From = null;
                To = null;
                return;
            }

            var parts = value.Split(" - ");
            if (parts.Length == 2)
            {
                // try to parse both dates
                From = TryParseDate(parts[0].Trim(), formatProvider);
                To = TryParseDate(parts[1].Trim(), formatProvider);
            }
            else if (parts.Length == 1)
            {
                // try to parse single date
                From = TryParseDate(parts[0].Trim(), formatProvider);
                To = null;
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

            if (From.HasValue && To.HasValue)
            {
                return $"{From.Value.ToString(fmt, culture)} - {To.Value.ToString(fmt, culture)}";
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

        /// <summary>
        /// Parses a date string to DateTime.
        /// </summary>
        /// <param name="input">The date string.</param>
        /// <param name="formatProvider">The culture-specific formatting provider.</param>
        /// <returns>Parsed DateTime? or null.</returns>
        private static DateTime? TryParseDate(string input, IFormatProvider formatProvider)
        {
            // try parse with current culture, fallback to invariant
            if (DateTime.TryParse(input, formatProvider, DateTimeStyles.None, out var dt))
            {
                return dt;
            }
            if (DateTime.TryParse(input, CultureInfo.InvariantCulture, DateTimeStyles.None, out dt))
            {
                return dt;
            }
            return null;
        }
    }
}
