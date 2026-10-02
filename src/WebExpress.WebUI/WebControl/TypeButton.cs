namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The value of the button's <c>type</c> attribute, which decides what pressing it does inside a
    /// form. It does not affect the appearance; the visual style comes from the button's color.
    /// </summary>
    public enum TypeButton
    {
        /// <summary>
        /// A plain button (<c>type="button"</c>) that neither submits nor resets its form.
        /// </summary>
        Default = 0,

        /// <summary>
        /// A button that submits its form (<c>type="submit"</c>).
        /// </summary>
        Submit = 1,

        /// <summary>
        /// A button that resets its form to the initial values (<c>type="reset"</c>).
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
