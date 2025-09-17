namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies the alignment of flexbox items.
    /// </summary>
    public enum TypeAlignFlex
    {
        /// <summary>
        /// No alignment.
        /// </summary>
        None,

        /// <summary>
        /// Items are packed toward the start of the flex container.
        /// </summary>
        Start,

        /// <summary>
        /// Items are packed toward the end of the flex container.
        /// </summary>
        End,

        /// <summary>
        /// Items are centered in the flex container.
        /// </summary>
        Center,

        /// <summary>
        /// Items are aligned such that their baselines align.
        /// </summary>
        Baseline,

        /// <summary>
        /// Items are stretched to fill the flex container.
        /// </summary>
        Stretch
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeAlignFlex"/> enum.
    /// </summary>
    public static class TypeAlignFlexboxExtensions
    {
        /// <summary>
        /// Converts the <see cref="TypeAlignFlex"/> value to a corresponding CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The CSS class corresponding to the layout.</returns>
        public static string ToClass(this TypeAlignFlex layout)
        {
            return layout switch
            {
                TypeAlignFlex.Start => "align-items-start",
                TypeAlignFlex.End => "align-items-end",
                TypeAlignFlex.Center => "align-items-center",
                TypeAlignFlex.Baseline => "align-items-baseline",
                TypeAlignFlex.Stretch => "align-items-stretch",
                _ => string.Empty,
            };
        }
    }

}
