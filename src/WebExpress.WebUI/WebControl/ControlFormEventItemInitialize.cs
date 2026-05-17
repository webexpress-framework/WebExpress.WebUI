namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Event argument for initialize a form item.
    /// </summary>
    /// <typeparam name="TValue">The type of the value to be assigned to the input control.</typeparam>
    public class ControlFormEventItemInitialize<TValue> : ControlFormEvent
        where TValue : IControlFormInputValue, new()
    {
        /// <summary>
        /// Gets the value for the form item.
        /// </summary>
        public TValue Value { get; } = new();

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormEventItemInitialize()
        {
        }
    }
}
