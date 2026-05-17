using System;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form input value of type int.
    /// </summary>
    public class ControlFormInputValueInt : IControlFormInputValue
    {
        /// <summary>
        /// Gets or sets the int value.
        /// </summary>
        public int Number { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormInputValueInt()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="value">The integer value to assign.</param>
        public ControlFormInputValueInt(int value)
        {
            Number = value;
        }

        /// <summary>
        /// Returns a formatted string representation of the value.
        /// </summary>
        /// <param name="format">Ignored for int.</param>
        /// <param name="formatProvider">Ignored for int.</param>
        /// <returns>A formatted string.</returns>
        public virtual string ToString(string format, IFormatProvider formatProvider)
        {
            return Number.ToString();
        }
    }
}
