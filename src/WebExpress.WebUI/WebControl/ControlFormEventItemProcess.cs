namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Event argument for processing form item inputs.
    /// </summary>
    public class ControlFormEventItemProcess : ControlFormEvent
    {
        /// <summary>
        /// Gets or sets the value to be checked during validation.
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormEventItemProcess()
        {
        }
    }
}
