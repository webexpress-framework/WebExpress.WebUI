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
        /// <typeparam name="TValue">The type of the value to be assigned to the input control.</typeparam>
        public ControlFormEventFormInitialize SetValue<TValue>(IControlFormItemInput input, TValue value)
            where TValue : IControlFormInputValue
        {
            Context.SetValue(input, value);

            return this;
        }
    }
}
