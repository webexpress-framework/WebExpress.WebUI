using System;
using System.Globalization;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Provides a abstract implementation of a form input value with formatting support.
    /// </summary>
    /// <typeparam name="T">The type of the input value.</typeparam>
    public abstract class ControlFormInputValue<T> : IControlFormInputValue
    {
        /// <summary>
        /// Gets or sets the typed value of the input.
        /// </summary>
        public T Value { get; set; }

        /// <summary>
        /// Initializes a new instance with the specified value.
        /// </summary>
        /// <param name="value">The input value.</param>
        public ControlFormInputValue(T value)
        {
            Value = value;
        }

        /// <summary>
        /// Returns a string representation of the value using the specified format and culture.
        /// If the value implements <see cref="IFormattable"/>, its formatting logic is used.
        /// Otherwise, <c>ToString()</c> is called directly.
        /// </summary>
        /// <param name="format">The format string (e.g. "N2", "yyyy-MM-dd").</param>
        /// <param name="formatProvider">The culture-specific formatting provider.</param>
        /// <returns>A formatted string representation of the value.</returns>
        public virtual string ToString(string format, IFormatProvider formatProvider)
        {
            if (Value is IFormattable formattable)
            {
                return formattable.ToString(format, formatProvider ?? CultureInfo.CurrentCulture);
            }

            return Value?.ToString() ?? string.Empty;
        }

        /// <summary>
        /// Returns a string representation of the value using the current culture and default formatting.
        /// </summary>
        /// <returns>A string representation of the value.</returns>
        public override string ToString()
        {
            return ToString(null, CultureInfo.CurrentCulture);
        }
    }
}
