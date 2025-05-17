namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the validity state of an input control.
    /// </summary>
    public enum TypeInputValidity
    {
        /// <summary>
        /// The default state of the input control.
        /// </summary>
        Default,

        /// <summary>
        /// The input control is in a success state.
        /// </summary>
        Success,

        /// <summary>
        /// The input control is in a warning state.
        /// </summary>
        Warning,

        /// <summary>
        /// The input control is in an error state.
        /// </summary>
        Error
    }
}
