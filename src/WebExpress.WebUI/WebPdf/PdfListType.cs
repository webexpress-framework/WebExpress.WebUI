namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Names the marker that precedes the items of a list.
    /// </summary>
    public enum PdfListType
    {
        /// <summary>
        /// A bullet, which changes its shape with the nesting depth.
        /// </summary>
        Bullet,

        /// <summary>
        /// Decimal numbers: 1, 2, 3, ...
        /// </summary>
        Numeric,

        /// <summary>
        /// Lowercase letters: a, b, c, ...
        /// </summary>
        LowerAlpha,

        /// <summary>
        /// Uppercase letters: A, B, C, ...
        /// </summary>
        UpperAlpha,

        /// <summary>
        /// Lowercase roman numerals: i, ii, iii, ...
        /// </summary>
        LowerRoman,

        /// <summary>
        /// Uppercase roman numerals: I, II, III, ...
        /// </summary>
        UpperRoman,

        /// <summary>
        /// No marker; the items are only indented.
        /// </summary>
        None
    }
}
