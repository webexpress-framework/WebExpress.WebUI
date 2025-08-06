using System;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form input value of type bool.
    /// </summary>
    public class ControlFormInputValueBool : IControlFormInputValue
    {
        /// <summary>
        /// Returns or sets the boolean value.
        /// </summary>
        public bool Checked { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormInputValueBool()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="value">The boolean value to assign.</param>
        public ControlFormInputValueBool(bool value)
        {
            Checked = value;
        }

        /// <summary>
        /// Returns a formatted string representation of the value.
        /// </summary>
        /// <param name="format">Ignored for bool.</param>
        /// <param name="formatProvider">Ignored for bool.</param>
        /// <returns>A formatted string.</returns>
        public virtual string ToString(string format, IFormatProvider formatProvider)
        {
            return Checked.ToString();
        }
    }
}
