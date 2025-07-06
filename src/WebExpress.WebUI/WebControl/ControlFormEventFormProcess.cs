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
        public string GetValue(IControlFormItemInput input)
        {
            return Context.GetValue(input);
        }
    }
}
