namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Represents the size of a page in points (1/72 inch), the unit every coordinate in a
    /// PDF file is given in.
    /// </summary>
    public readonly struct PdfPageSize
    {
        /// <summary>
        /// Returns the ISO 216 A3 format.
        /// </summary>
        public static PdfPageSize A3 { get; } = new(841.89f, 1190.55f);

        /// <summary>
        /// Returns the ISO 216 A4 format, the default of a document.
        /// </summary>
        public static PdfPageSize A4 { get; } = new(595.28f, 841.89f);

        /// <summary>
        /// Returns the ISO 216 A5 format.
        /// </summary>
        public static PdfPageSize A5 { get; } = new(419.53f, 595.28f);

        /// <summary>
        /// Returns the north american letter format.
        /// </summary>
        public static PdfPageSize Letter { get; } = new(612f, 792f);

        /// <summary>
        /// Returns the north american legal format.
        /// </summary>
        public static PdfPageSize Legal { get; } = new(612f, 1008f);

        /// <summary>
        /// Returns the width in points.
        /// </summary>
        public float Width { get; }

        /// <summary>
        /// Returns the height in points.
        /// </summary>
        public float Height { get; }

        /// <summary>
        /// Initializes a new instance of the struct.
        /// </summary>
        /// <param name="width">The width in points.</param>
        /// <param name="height">The height in points.</param>
        public PdfPageSize(float width, float height)
        {
            Width = width;
            Height = height;
        }

        /// <summary>
        /// Returns the same format turned on its side.
        /// </summary>
        /// <returns>The format with the longer edge horizontal.</returns>
        public PdfPageSize Landscape()
        {
            return Width >= Height ? this : new PdfPageSize(Height, Width);
        }

        /// <summary>
        /// Converts millimeters into points, the unit page sizes and margins are given in.
        /// </summary>
        /// <param name="millimeters">The length in millimeters.</param>
        /// <returns>The length in points.</returns>
        public static float FromMillimeters(float millimeters)
        {
            return millimeters * 72f / 25.4f;
        }
    }
}
