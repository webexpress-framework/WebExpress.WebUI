using System;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form input value of type string.
    /// </summary>
    public class ControlFormInputValueString : IControlFormInputValue
    {
        /// <summary>
        /// Gets or sets the string value.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormInputValueString()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="value">The string value to assign.</param>
        public ControlFormInputValueString(string value)
        {
            Text = value;
        }

        /// <summary>
        /// Returns a formatted string representation of the value.
        /// </summary>
        /// <param name="format">Ignored for strings.</param>
        /// <param name="formatProvider">Ignored for strings.</param>
        /// <returns>A formatted string.</returns>
        public virtual string ToString(string format, IFormatProvider formatProvider)
        {
            if (string.IsNullOrEmpty(Text))
            {
                return string.Empty;
            }

            return Text;
        }
    }
}
