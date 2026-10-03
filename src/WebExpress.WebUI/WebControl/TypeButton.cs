namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The value of the button's <c>type</c> attribute, which decides what pressing it does inside a
    /// form. It does not affect the appearance; the visual style comes from the button's color.
    /// </summary>
    public enum TypeButton
    {
        /// <summary>
        /// For buttons that run script; it is the safe choice inside a form, where a button
        /// without a type would submit the form by accident.
        /// </summary>
        Default = 0,

        /// <summary>
        /// For the button that sends the form, so pressing enter in a field triggers it as well.
        /// </summary>
        Submit = 1,

        /// <summary>
        /// For discarding all edits at once; rarely wanted, since a misclick loses the user's input.
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
