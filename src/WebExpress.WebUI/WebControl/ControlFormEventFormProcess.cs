namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Event argument for processing form inputs.
    /// </summary>
    public class ControlFormEventFormProcess : ControlFormEvent
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormEventFormProcess()
        {
        }

        /// <summary>
        /// Retrieves the value associated with the specified input control.
        /// </summary>
        /// <param name="input">The input control whose value is to be retrieved.</param>
        /// <returns>The value associated with the input control, or <c>null</c> if not found.</returns>
        /// <typeparam name="TValue">The type of the value to be assigned to the input control.</typeparam>
        public TValue GetValue<TValue>(IControlFormItemInput input)
            where TValue : class, IControlFormInputValue, new()
        {
            return Context.GetValue<TValue>(input);
        }
    }
}
