namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The visual style of a spinner.
    /// </summary>
    public enum TypeSpinner
    {
        /// <summary>
        /// A rotating border spinner.
        /// </summary>
        Border,

        /// <summary>
        /// A growing/pulsing spinner.
        /// </summary>
        Grow
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeSpinner"/> enum.
    /// </summary>
    public static class TypeSpinnerExtensions
    {
        /// <summary>
        /// Converts the spinner style to a CSS class.
        /// </summary>
        /// <param name="type">The spinner style.</param>
        /// <returns>The CSS class corresponding to the style.</returns>
        public static string ToClass(this TypeSpinner type)
        {
            return type switch
            {
                TypeSpinner.Grow => "spinner-grow",
                _ => "spinner-border",
            };
        }

        /// <summary>
        /// Converts the spinner style to its small-size CSS class.
        /// </summary>
        /// <param name="type">The spinner style.</param>
        /// <returns>The small-size CSS class corresponding to the style.</returns>
        public static string ToSmallClass(this TypeSpinner type)
        {
            return type switch
            {
                TypeSpinner.Grow => "spinner-grow-sm",
                _ => "spinner-border-sm",
            };
        }
    }
}
