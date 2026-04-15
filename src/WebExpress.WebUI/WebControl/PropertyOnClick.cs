namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a property that handles the OnClick event.
    /// </summary>
    public class PropertyOnClick
    {
        /// <summary>
        /// Gets the system value.
        /// </summary>
        public TypeOnChange SystemValue { get; protected set; }

        /// <summary>
        /// Gets the user-defined value.
        /// </summary>
        public string Value { get; protected set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="value">The user-defined value.</param>
        public PropertyOnClick(string value)
        {
            Value = value;
        }

        /// <summary>
        /// Returns a string that represents the current object.
        /// </summary>
        /// <returns>A string that represents the current object.</returns>
        public override string ToString()
        {
            return Value;
        }
    }
}
