using System;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form input value of type uint.
    /// </summary>
    public class ControlFormInputValueUInt : IControlFormInputValue
    {
        /// <summary>
        /// Gets or sets the int value.
        /// </summary>
        public uint Number { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormInputValueUInt()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="value">The unsigned integer value to assign.</param>
        public ControlFormInputValueUInt(uint value)
        {
            Number = value;
        }

        /// <summary>
        /// Returns a formatted string representation of the value.
        /// </summary>
        /// <param name="format">Ignored for uint.</param>
        /// <param name="formatProvider">Ignored for uint.</param>
        /// <returns>A formatted string.</returns>
        public virtual string ToString(string format, IFormatProvider formatProvider)
        {
            return Number.ToString();
        }
    }
}
