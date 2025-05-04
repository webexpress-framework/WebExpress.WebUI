namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Event argument for initialize a form item.
    /// </summary>
    public class ControlFormEventFormInitialize : ControlFormEvent
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormEventFormInitialize()
        {
        }

        /// <summary>
        /// Sets the value for the specified input control.
        /// </summary>
        /// <param name="input">The input control for which the value is to be set.</param>
        /// <param name="value">The value to set for the input control.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlFormEventFormInitialize SetValue(IControlFormItemInput input, string value)
        {
            Context.SetValue(input, value);

            return this;
        }
    }
}
