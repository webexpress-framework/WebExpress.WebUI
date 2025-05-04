namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Event argument for initialize a form item.
    /// </summary>
    public class ControlFormEventItemInitialize : ControlFormEvent
    {
        /// <summary>
        /// The value for the form item.
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormEventItemInitialize()
        {
        }
    }
}
