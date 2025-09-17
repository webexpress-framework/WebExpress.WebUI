namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the type of justification for a flexbox layout.
    /// </summary>
    public enum TypeJustifiedFlex
    {
        /// <summary>
        /// No justification.
        /// </summary>
        None,

        /// <summary>
        /// Items are justified at the start of the container.
        /// </summary>
        Start,

        /// <summary>
        /// Items are justified at the end of the container.
        /// </summary>
        End,

        /// <summary>
        /// Items are justified at the center of the container.
        /// </summary>
        Center,

        /// <summary>
        /// Items are justified with space between them.
        /// </summary>
        Between,

        /// <summary>
        /// Items are justified with space around them.
        /// </summary>
        Around
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeJustifiedFlex"/> enum.
    /// </summary>
    public static class TypeTypeJustifiedFlexboxExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeJustifiedFlex"/> value to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The CSS class corresponding to the layout.</returns>
        public static string ToClass(this TypeJustifiedFlex layout)
        {
            return layout switch
            {
                TypeJustifiedFlex.Start => "justify-content-start",
                TypeJustifiedFlex.End => "justify-content-end",
                TypeJustifiedFlex.Center => "justify-content-center",
                TypeJustifiedFlex.Between => "justify-content-between",
                TypeJustifiedFlex.Around => "justify-content-around",
                _ => string.Empty,
            };
        }
    }

}
