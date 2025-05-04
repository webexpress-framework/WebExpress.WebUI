namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Event argument for validating form item inputs.
    /// </summary>
    public class ControlFormEventItemValidate : ControlFormEventFormValidate
    {
        /// <summary>
        /// Gets or sets the value to be checked during validation.
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormEventItemValidate()
        {
        }
    }
}
