namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The error correction level of a QR code. A higher level survives more
    /// damage to the printed symbol but leaves less room for data, so a value
    /// that fits at one level may need a larger symbol at the next.
    /// </summary>
    public enum TypeErrorCorrectionBarcode
    {
        /// <summary>
        /// Represents the default value, which is <see cref="Medium"/>.
        /// </summary>
        Default = 0,

        /// <summary>
        /// Recovers about 7% of the symbol. The choice for a code that is only
        /// ever shown on screen.
        /// </summary>
        Low = 1,

        /// <summary>
        /// Recovers about 15% of the symbol.
        /// </summary>
        Medium = 2,

        /// <summary>
        /// Recovers about 25% of the symbol.
        /// </summary>
        Quartile = 3,

        /// <summary>
        /// Recovers about 30% of the symbol. The choice for a code that is
        /// printed on something that gets handled, or that carries a logo.
        /// </summary>
        High = 4
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeErrorCorrectionBarcode"/> enumeration.
    /// </summary>
    public static class TypeErrorCorrectionBarcodeExtensions
    {
        /// <summary>
        /// Converts the level to the value the client expects.
        /// </summary>
        /// <param name="type">The level to convert.</param>
        /// <returns>The value.</returns>
        public static string ToValue(this TypeErrorCorrectionBarcode type)
        {
            return type switch
            {
                TypeErrorCorrectionBarcode.Low => "L",
                TypeErrorCorrectionBarcode.Quartile => "Q",
                TypeErrorCorrectionBarcode.High => "H",
                _ => "M"
            };
        }
    }
}
