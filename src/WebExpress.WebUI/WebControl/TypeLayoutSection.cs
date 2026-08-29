namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The layout options for the section control element.
    /// </summary>
    public enum TypeLayoutSection
    {
        /// <summary>
        /// The label row sits above the body, which hangs off the vertical guide line. The
        /// default: it reads top to bottom and survives any column width.
        /// </summary>
        Stacked,

        /// <summary>
        /// The label moves into a column of its own beside the body, and the guide line becomes
        /// the divider between the two. Reads as a definition list at section scale, which suits
        /// a wide zone holding many short sections - but it needs that width, so a narrow
        /// container falls back to the stacked layout.
        /// </summary>
        Aside,

        /// <summary>
        /// The label is followed by a hairline running across the remaining width, and the body
        /// sits indented below it without a guide. The strongest horizontal break of the three,
        /// for a long page whose sections a reader scrolls past rather than compares.
        /// </summary>
        Rule
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeLayoutSection"/> enum.
    /// </summary>
    public static class TypeLayoutSectionExtensions
    {
        /// <summary>
        /// Converts the layout to a CSS class.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The CSS class corresponding to the layout.</returns>
        public static string ToClass(this TypeLayoutSection layout)
        {
            return layout switch
            {
                TypeLayoutSection.Aside => "wx-section-aside",
                TypeLayoutSection.Rule => "wx-section-rule",
                _ => string.Empty,
            };
        }
    }
}
