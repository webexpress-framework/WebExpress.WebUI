using System;
using System.Globalization;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form input value that stores a numeric range consisting
    /// of a lower (<see cref="MinValue"/>) and an upper (<see cref="MaxValue"/>)
    /// boundary. The value is serialized as <c>min;max</c> using
    /// <see cref="CultureInfo.InvariantCulture"/>, so the payload survives
    /// round-trips between the client (JavaScript hidden input) and the
    /// server.
    /// </summary>
    public class ControlFormInputValueDualRange : IControlFormInputValue
    {
        /// <summary>
        /// Gets or sets the lower bound of the selected range.
        /// </summary>
        public float MinValue { get; set; }

        /// <summary>
        /// Gets or sets the upper bound of the selected range.
        /// </summary>
        public float MaxValue { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormInputValueDualRange()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class with explicit boundaries.
        /// </summary>
        /// <param name="minValue">The lower bound of the range.</param>
        /// <param name="maxValue">The upper bound of the range.</param>
        public ControlFormInputValueDualRange(float minValue, float maxValue)
        {
            MinValue = minValue;
            MaxValue = maxValue;
        }

        /// <summary>
        /// Initializes a new instance of the class from the wire format produced
        /// by the JavaScript component (semicolon-separated <c>min;max</c>).
        /// </summary>
        /// <param name="value">
        /// The serialized payload. Whitespace is tolerated and either component
        /// may be missing - missing parts fall back to <c>0</c>.
        /// </param>
        public ControlFormInputValueDualRange(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return;
            }

            var parts = value.Split(';');

            // first segment is the lower bound
            if (parts.Length > 0
                && float.TryParse(parts[0].Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var min))
            {
                MinValue = min;
            }

            // second segment is the upper bound; tolerate single-value payloads
            if (parts.Length > 1
                && float.TryParse(parts[1].Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var max))
            {
                MaxValue = max;
            }
            else if (parts.Length == 1)
            {
                MaxValue = MinValue;
            }
        }

        /// <summary>
        /// Returns the wire format representation (<c>min;max</c>) using
        /// <see cref="CultureInfo.InvariantCulture"/>. When a non-null
        /// <paramref name="format"/> is supplied each boundary is formatted
        /// individually using the supplied culture.
        /// </summary>
        /// <param name="format">The numeric format string applied per boundary.</param>
        /// <param name="formatProvider">The culture used together with <paramref name="format"/>.</param>
        /// <returns>The serialized range value.</returns>
        public virtual string ToString(string format, IFormatProvider formatProvider)
        {
            // null format keeps the round-trip payload culture-invariant, which is
            // what the JavaScript component expects on the wire
            if (format is null)
            {
                return string.Concat
                (
                    MinValue.ToString(CultureInfo.InvariantCulture),
                    ";",
                    MaxValue.ToString(CultureInfo.InvariantCulture)
                );
            }

            var culture = formatProvider ?? CultureInfo.CurrentCulture;

            return string.Concat
            (
                MinValue.ToString(format, culture),
                ";",
                MaxValue.ToString(format, culture)
            );
        }

        /// <summary>
        /// Returns the wire format representation using
        /// <see cref="CultureInfo.InvariantCulture"/>.
        /// </summary>
        /// <returns>The serialized range value.</returns>
        public override string ToString()
        {
            return ToString(null, CultureInfo.InvariantCulture);
        }

        /// <summary>
        /// Determines whether the specified object is equal to the current object.
        /// </summary>
        /// <param name="obj">The object to compare with the current object.</param>
        /// <returns>True if the specified object is equal to the current object; otherwise, false.</returns>
        public override bool Equals(object obj)
        {
            if (obj is ControlFormInputValueDualRange range)
            {
                return MinValue == range.MinValue && MaxValue == range.MaxValue;
            }

            return false;
        }

        /// <summary>
        /// Serves as the default hash function.
        /// </summary>
        /// <returns>A hash code for the current object.</returns>
        public override int GetHashCode()
        {
            return HashCode.Combine(MinValue, MaxValue);
        }
    }
}
