namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the type of layout for a flexbox.
    /// </summary>
    public enum TypeLayoutFlex
    {
        /// <summary>
        /// No layout specified.
        /// </summary>
        None,

        /// <summary>
        /// Default flexbox layout.
        /// </summary>
        Default,

        /// <summary>
        /// Inline flexbox layout.
        /// </summary>
        Inline
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeLayoutFlex"/> enum.
    /// </summary>
    public static class TypeInlineFlexboxExtensions
    {
        /// <summary>
        /// Converts the layout type to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The CSS class corresponding to the layout.</returns>
        public static string ToClass(this TypeLayoutFlex layout)
        {
            return layout switch
            {
                TypeLayoutFlex.Default => "d-flex",
                TypeLayoutFlex.Inline => "d-inline-flex",
                _ => string.Empty,
            };
        }
    }
}
