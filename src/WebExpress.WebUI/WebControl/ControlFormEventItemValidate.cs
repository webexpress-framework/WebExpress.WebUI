namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Event argument for validating form item inputs.
    /// </summary>
    /// <typeparam name="TValue">The type of the value to be assigned to the input control.</typeparam>
    public class ControlFormEventItemValidate<TValue> : ControlFormEventFormValidate
        where TValue : class, IControlFormInputValue, new()
    {
        /// <summary>
        /// Gets the value for the form item.
        /// </summary>
        public TValue Value { get; } = new();

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="value">The value to associate with this instance.</param>
        public ControlFormEventItemValidate(TValue value)
        {
            Value = value;
        }
    }
}
