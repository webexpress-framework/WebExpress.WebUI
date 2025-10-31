namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines the possible states of a form.
    /// </summary>
    public enum TypeFormState
    {
        /// <summary>
        /// The form has been created but not yet processed.
        /// </summary>
        Default,

        /// <summary>
        /// An error has occurred in the form.
        /// </summary>
        Error,

        /// <summary>
        /// The form has been successfully confirmed.
        /// </summary>
        Success,
    }
}
