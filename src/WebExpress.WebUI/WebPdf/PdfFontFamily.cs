namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Names the font families a document can be set in.
    /// <para>
    /// They are the standard fonts every PDF reader carries, so nothing has to be embedded
    /// and a document stays small. The price is the character set: these fonts are addressed
    /// through the WinAnsi encoding, which covers the western european languages; a character
    /// outside of it is written as a question mark.
    /// </para>
    /// </summary>
    public enum PdfFontFamily
    {
        /// <summary>
        /// A sans serif face (Helvetica, metrically equivalent to Arial).
        /// </summary>
        Helvetica,

        /// <summary>
        /// A serif face (Times, metrically equivalent to Times New Roman).
        /// </summary>
        Times,

        /// <summary>
        /// A monospaced face (Courier), used for code.
        /// </summary>
        Courier
    }
}
