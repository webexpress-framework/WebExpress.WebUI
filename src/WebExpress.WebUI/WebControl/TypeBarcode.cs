namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The symbology a barcode is encoded in.
    /// </summary>
    public enum TypeBarcode
    {
        /// <summary>
        /// Represents the default value, which is <see cref="Code128"/>.
        /// </summary>
        Default = 0,

        /// <summary>
        /// Code 128, a dense linear symbology covering the printable ascii range.
        /// It is the general purpose choice for identifiers of any shape.
        /// </summary>
        Code128 = 1,

        /// <summary>
        /// Code 39, a linear symbology limited to digits, upper case letters and
        /// a handful of punctuation marks. It is less dense than Code 128 but is
        /// still what many older scanners and label printers expect.
        /// </summary>
        Code39 = 2,

        /// <summary>
        /// EAN-13, the thirteen digit article number of retail trade. The check
        /// digit is computed when it is missing and verified when it is given.
        /// </summary>
        Ean13 = 3,

        /// <summary>
        /// EAN-8, the shortened eight digit article number for small packages.
        /// </summary>
        Ean8 = 4,

        /// <summary>
        /// QR code, a two-dimensional symbology. It holds far more than a linear
        /// one and survives partial damage, which makes it the choice for urls
        /// and for anything that is scanned by a phone camera.
        /// </summary>
        QR = 5
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeBarcode"/> enumeration.
    /// </summary>
    public static class TypeBarcodeExtensions
    {
        /// <summary>
        /// Converts the symbology to the value the client expects.
        /// </summary>
        /// <param name="type">The symbology to convert.</param>
        /// <returns>The value.</returns>
        public static string ToValue(this TypeBarcode type)
        {
            return type switch
            {
                TypeBarcode.Code39 => "code39",
                TypeBarcode.Ean13 => "ean13",
                TypeBarcode.Ean8 => "ean8",
                TypeBarcode.QR => "qr",
                _ => "code128"
            };
        }
    }
}
