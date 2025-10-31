namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the type of a button.
    /// </summary>
    public enum TypeButton
    {
        /// <summary>
        /// Default button type.
        /// </summary>
        Default = 0, // Button

        /// <summary>
        /// Submit button type.
        /// </summary>
        Submit = 1,

        /// <summary>
        /// Reset button type.
        /// </summary>
        Reset = 2
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeButton"/> enum.
    /// </summary>
    public static class TypeButtonExtensions
    {
        /// <summary>
        /// Converts the button type to its corresponding string representation.
        /// </summary>
        /// <param name="type">The button type.</param>
        /// <returns>The string representation of the button type.</returns>
        public static string ToTypeString(this TypeButton type)
        {
            return type switch
            {
                TypeButton.Submit => "submit",
                TypeButton.Reset => "reset",
                _ => "button",
            };
        }
    }
}
