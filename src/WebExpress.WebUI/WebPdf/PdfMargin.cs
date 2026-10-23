namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Represents the white space between the edge of a page and its content, in points.
    /// The header and footer lines are set inside the top and bottom margin, so a margin
    /// that is too narrow for them pushes them against the page edge.
    /// </summary>
    public readonly struct PdfMargin
    {
        /// <summary>
        /// Returns the top margin.
        /// </summary>
        public float Top { get; }

        /// <summary>
        /// Returns the right margin.
        /// </summary>
        public float Right { get; }

        /// <summary>
        /// Returns the bottom margin.
        /// </summary>
        public float Bottom { get; }

        /// <summary>
        /// Returns the left margin.
        /// </summary>
        public float Left { get; }

        /// <summary>
        /// Initializes a new instance of the struct with the same margin on every side.
        /// </summary>
        /// <param name="all">The margin in points.</param>
        public PdfMargin(float all)
            : this(all, all, all, all)
        {
        }

        /// <summary>
        /// Initializes a new instance of the struct.
        /// </summary>
        /// <param name="vertical">The top and bottom margin in points.</param>
        /// <param name="horizontal">The left and right margin in points.</param>
        public PdfMargin(float vertical, float horizontal)
            : this(vertical, horizontal, vertical, horizontal)
        {
        }

        /// <summary>
        /// Initializes a new instance of the struct.
        /// </summary>
        /// <param name="top">The top margin in points.</param>
        /// <param name="right">The right margin in points.</param>
        /// <param name="bottom">The bottom margin in points.</param>
        /// <param name="left">The left margin in points.</param>
        public PdfMargin(float top, float right, float bottom, float left)
        {
            Top = top;
            Right = right;
            Bottom = bottom;
            Left = left;
        }
    }
}
