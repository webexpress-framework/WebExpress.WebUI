namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The room a field of a <see cref="ControlGroup"/> gives its content.
    /// </summary>
    /// <remarks>
    /// The right amount depends on what a field holds, which the group cannot know: a control
    /// brings its own padding and needs little around it, while bare text needs the room a
    /// card would give it, and a dense row of figures reads better with less.
    /// </remarks>
    public enum TypeSpacingGroup
    {
        /// <summary>
        /// The room a field holding a control of its own needs.
        /// </summary>
        Default,

        /// <summary>
        /// No padding at all: the field is the bounds of what it holds.
        /// </summary>
        None,

        /// <summary>
        /// Less room, for a dense row.
        /// </summary>
        Narrow,

        /// <summary>
        /// More room, for a field holding text rather than a control.
        /// </summary>
        Wide
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeSpacingGroup"/> enum.
    /// </summary>
    public static class TypeSpacingGroupExtensions
    {
        /// <summary>
        /// Converts the spacing to the value the client controller reads.
        /// </summary>
        /// <param name="spacing">The spacing.</param>
        /// <returns>The wire value, or <c>null</c> for the default.</returns>
        public static string ToValue(this TypeSpacingGroup spacing)
        {
            return spacing switch
            {
                TypeSpacingGroup.None => "none",
                TypeSpacingGroup.Narrow => "narrow",
                TypeSpacingGroup.Wide => "wide",
                _ => null,
            };
        }
    }
}
