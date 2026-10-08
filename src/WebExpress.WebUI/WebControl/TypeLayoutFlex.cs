namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Whether a control is a flex container, and whether it behaves as a block or as an inline
    /// element towards its surroundings. The direction its children are laid out in is set
    /// separately with <see cref="TypeDirection"/>.
    /// </summary>
    public enum TypeLayoutFlex
    {
        /// <summary>
        /// The control is not a flex container.
        /// </summary>
        None,

        /// <summary>
        /// For a container that takes the full width and starts on its own line, such as a toolbar row.
        /// </summary>
        Default,

        /// <summary>
        /// For a container that sits within a line of text and is only as wide as its children,
        /// such as an icon next to a label.
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
