namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the result of a validation process.
    /// </summary>
    public class ValidationResult
    {
        /// <summary>
        /// Returns the type of the validation result.
        /// </summary>
        public TypeInputValidity Type { get; private set; }

        /// <summary>
        /// Returns the error text.
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
