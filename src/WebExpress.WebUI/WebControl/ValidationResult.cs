namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Holds the outcome of validating a form or input: whether it passed and any messages to show the user.
    /// </summary>
    public class ValidationResult
    {
        /// <summary>
        /// Gets the type of the validation result.
        /// </summary>
        public TypeInputValidity Type { get; private set; }

        /// <summary>
        /// Gets the error text.
        /// </summary>
        public string Text { get; private set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="type">The type of the validation result.</param>
        /// <param name="text">The error text.</param>
        public ValidationResult(TypeInputValidity type, string text)
        {
            Type = type;
            Text = text;
        }
    }
}
