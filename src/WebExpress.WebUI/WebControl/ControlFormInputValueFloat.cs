using System;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form input value of type float.
    /// </summary>
    public class ControlFormInputValueFloat : IControlFormInputValue
    {
        /// <summary>
        /// Returns or sets the float value.
        /// </summary>
        public float Number { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormInputValueFloat()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="value">The float value to assign.</param>
        public ControlFormInputValueFloat(float value)
        {
            Number = value;
        }

        /// <summary>
        /// Returns a formatted string representation of the value.
        /// </summary>
        /// <param name="format">The format string.</param>
        /// <param name="formatProvider">The format provider.</param>
        /// <returns>A formatted string.</returns>
        public virtual string ToString(string format = null, IFormatProvider formatProvider = null)
        {
            return Number.ToString(format, formatProvider);
        }
    }
}
