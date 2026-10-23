namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Names the horizontal alignment of the lines of a block.
    /// </summary>
    public enum PdfTextAlign
    {
        /// <summary>
        /// The lines start at the left edge.
        /// </summary>
        Left,

        /// <summary>
        /// The lines are centered.
        /// </summary>
        Center,

        /// <summary>
        /// The lines end at the right edge.
        /// </summary>
        Right,

        /// <summary>
        /// The lines fill the width, except the last line of a paragraph.
        /// </summary>
        Justify
    }
}
