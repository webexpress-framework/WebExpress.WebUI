namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Event argument for processing form item inputs.
    /// </summary>
    /// <typeparam name="TValue">The type of the value to be assigned to the input control.</typeparam>
    public class ControlFormEventItemProcess<TValue> : ControlFormEvent
        where TValue : class, IControlFormInputValue, new()
    {
        /// <summary>
        /// Returns the value for the form item.
        /// </summary>
        public TValue Value { get; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="value">The value to associate with this instance.</param>
        public ControlFormEventItemProcess(TValue value)
        {
            Value = value;
        }
    }
}
