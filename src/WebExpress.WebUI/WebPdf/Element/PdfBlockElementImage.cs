namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a picture.
    /// <para>
    /// JPEG and PNG are understood; JPEG is embedded as it is, PNG is re-encoded with its
    /// transparency kept. The picture comes from <see cref="Data"/>, from a <c>data:</c>
    /// address in <see cref="Source"/>, or from <see cref="PdfDocument.ImageResolver"/>. The
    /// renderer never fetches an address on its own: the document is generated on the server,
    /// where following an address that a user wrote into a text would let that user make the
    /// server issue requests on their behalf. A picture that cannot be read is replaced by its
    /// alternative text.
    /// </para>
    /// </summary>
    public class PdfBlockElementImage : PdfBlockElement
    {
        /// <summary>
        /// Gets or sets the address of the picture.
        /// </summary>
        public string Source { get; set; }

        /// <summary>
        /// Gets or sets the encoded picture, which takes precedence over <see cref="Source"/>.
        /// </summary>
        public byte[] Data { get; set; }

        /// <summary>
        /// Gets or sets the text that stands in for the picture.
        /// </summary>
        public string AltText { get; set; }

        /// <summary>
        /// Gets or sets the width in points, or null to derive it from the picture at 96 dpi.
        /// A picture is never set wider than its container.
        /// </summary>
        public float? Width { get; set; }

        /// <summary>
        /// Gets or sets the height in points, or null to keep the aspect ratio.
        /// </summary>
        public float? Height { get; set; }

        /// <summary>
        /// Gets or sets the horizontal position, or null to take the one of the container.
        /// </summary>
        public PdfTextAlign? Align { get; set; }

        /// <summary>
        /// Returns the text of the element without any formatting.
        /// </summary>
        public override string PlainText => AltText ?? string.Empty;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public PdfBlockElementImage()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="source">The address of the picture.</param>
        /// <param name="altText">The text that stands in for the picture.</param>
        public PdfBlockElementImage(string source, string altText = null)
        {
            Source = source;
            AltText = altText;
        }
    }
}
