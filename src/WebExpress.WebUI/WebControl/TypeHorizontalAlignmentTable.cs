namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// How the content of a table column is aligned horizontally. The alignment belongs to
    /// the column, not to a single cell, so a column of figures lines up its digits from the
    /// header down to the last row.
    /// </summary>
    public enum TypeHorizontalAlignmentTable
    {
        /// <summary>
        /// The default alignment, which is the start of the line.
        /// </summary>
        Default,

        /// <summary>
        /// Align to the left.
        /// </summary>
        Left,

        /// <summary>
        /// Align to the center.
        /// </summary>
        Center,

        /// <summary>
        /// Align to the right.
        /// </summary>
        Right
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeHorizontalAlignmentTable"/> enum.
    /// </summary>
    public static class TypeHorizontalAlignmentTableExtensions
    {
        /// <summary>
        /// Converts the alignment to the value the table script reads from a column. The
        /// default has no value, so a column without an alignment carries no attribute.
        /// </summary>
        /// <param name="alignment">The alignment to be converted.</param>
        /// <returns>The value of the alignment, or null for the default.</returns>
        public static string ToValue(this TypeHorizontalAlignmentTable alignment)
        {
            return alignment switch
            {
                TypeHorizontalAlignmentTable.Left => "left",
                TypeHorizontalAlignmentTable.Center => "center",
                TypeHorizontalAlignmentTable.Right => "right",
                _ => null,
            };
        }
    }
}
