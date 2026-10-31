using System;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the value of a form input field as a strongly typed boolean (true/false).
    /// </summary>
    public class ControlFormInputValueBool : IControlFormInputValue
    {
        /// <summary>
        /// Gets or sets the boolean value.
        /// </summary>
        public bool Checked { get; set; }

        /// <summary>
        /// Gets a value indicating whether the box is unchecked; a required box has to be
        /// checked, as the browser treats a required checkbox.
        /// </summary>
        public bool IsEmpty => !Checked;

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
