namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a property that changes based on system or user-defined values.
    /// </summary>
    public class PropertyOnChange
    {
        /// <summary>
        /// Gets the system value.
        /// </summary>
        public TypeOnChange SystemValue { get; protected set; }

        /// <summary>
        /// Gets the user-defined value.
        /// </summary>
        public string UserValue { get; protected set; }

        /// <summary>
        /// Initializes a new instance of the class with a system value.
        /// </summary>
        /// <param name="value">The system value.</param>
        public PropertyOnChange(TypeOnChange value)
        {
            SystemValue = value;
        }

        /// <summary>
        /// Initializes a new instance of the class with a user-defined value.
        /// </summary>
        /// <param name="value">The user-defined value.</param>
        public PropertyOnChange(string value)
        {
            SystemValue = TypeOnChange.None;
            UserValue = value;
        }

        /// <summary>
        /// Converts the value to its string representation.
        /// </summary>
        /// <returns>The string representation of the value.</returns>
        public override string ToString()
        {
            if (SystemValue != TypeOnChange.None)
            {
                return SystemValue.ToValue();
            }
            else if (!string.IsNullOrWhiteSpace(UserValue))
            {
                return UserValue;
            }

            return null;
        }
    }
}
