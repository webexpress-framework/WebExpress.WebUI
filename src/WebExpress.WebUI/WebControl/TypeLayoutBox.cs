namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The frame options for the box control element.
    /// </summary>
    /// <remarks>
    /// A box exists to draw a line around content that belongs together, and the kind of line
    /// is what tells the reader how strongly that content is set apart from the page: a hairline
    /// merely groups, a dashed line marks something provisional or optional, a raised surface
    /// lifts content out of the flow, and a bar on the leading edge points at it without
    /// enclosing it. The frame is therefore the one choice the control asks for, and every
    /// other visual property builds on it.
    /// </remarks>
    public enum TypeLayoutBox
    {
        /// <summary>
        /// A hairline around the content. The default: it groups without claiming attention.
        /// </summary>
        Solid,

        /// <summary>
        /// A dashed hairline. Reads as provisional - a draft, a placeholder, an area where
        /// something can be dropped.
        /// </summary>
        Dashed,

        /// <summary>
        /// A dotted hairline. The quietest of the drawn frames, for a grouping that should be
        /// felt rather than seen.
        /// </summary>
        Dotted,

        /// <summary>
        /// A double line. The most formal of the drawn frames, for content quoted or cited
        /// from elsewhere.
        /// </summary>
        Double,

        /// <summary>
        /// A bar on the leading edge and no other line. Points at the content without
        /// enclosing it, like a margin note.
        /// </summary>
        Accent,

        /// <summary>
        /// No line, but a shadow that lifts the content off the page.
        /// </summary>
        Raised,

        /// <summary>
        /// No line, but a subtle fill that sinks the content into the page.
        /// </summary>
        Inset,

        /// <summary>
        /// No frame at all. The box keeps its padding and its header, so it still organizes
        /// and lines up with framed boxes beside it, but draws nothing.
        /// </summary>
        None
    }

    /// <summary>
    /// Extension methods for the <see cref="TypeLayoutBox"/> enum.
    /// </summary>
    public static class TypeLayoutBoxExtensions
    {
        /// <summary>
        /// Converts the layout to its data attribute representation.
        /// </summary>
        /// <param name="layout">The layout to be converted.</param>
        /// <returns>The data attribute value corresponding to the layout.</returns>
        public static string ToValue(this TypeLayoutBox layout)
        {
            return layout switch
            {
                TypeLayoutBox.Dashed => "dashed",
                TypeLayoutBox.Dotted => "dotted",
                TypeLayoutBox.Double => "double",
                TypeLayoutBox.Accent => "accent",
                TypeLayoutBox.Raised => "raised",
                TypeLayoutBox.Inset => "inset",
                TypeLayoutBox.None => "none",
                _ => "solid",
            };
        }
    }
}
