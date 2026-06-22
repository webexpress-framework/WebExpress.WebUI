namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The predefined height options for sizing a control.
    /// </summary>
    public enum TypeHeight
    {
        /// <summary>
        /// Default height.
        /// </summary>
        Default,

        /// <summary>
        /// Height of 25%.
        /// </summary>
        TwentyFive,

        /// <summary>
        /// Height of 50%.
        /// </summary>
        Fifty,

        /// <summary>
        /// Height of 75%.
        /// </summary>
        SeventyFive,

        /// <summary>
        /// Height of 100%.
        /// </summary>
        OneHundred
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeHeight"/> enum.
    /// </summary>
    public static class TypesHeightExtensions
    {
        /// <summary>
        /// Converts the height option to a CSS class.
        /// </summary>
        /// <param name="height">The height option to convert.</param>
        /// <returns>The corresponding CSS class for the height option.</returns>
        public static string ToClass(this TypeHeight height)
        {
            return height switch
            {
                TypeHeight.TwentyFive => "h-25",
                TypeHeight.Fifty => "h-50",
                TypeHeight.SeventyFive => "h-75",
                TypeHeight.OneHundred => "h-100",
                _ => string.Empty,
            };
        }
    }
}
