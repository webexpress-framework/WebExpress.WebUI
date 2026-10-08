using WebExpress.WebUI.WebPdf;

namespace WebExpress.WebUI.Test.WebPdf
{
    /// <summary>
    /// Tests the metrics and the encoding of the standard fonts, which the line breaking
    /// depends on.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestPdfFont
    {
        /// <summary>
        /// Tests widths against the published metrics of the standard fonts.
        /// </summary>
        [Theory]
        [InlineData((int)PdfFontFace.Helvetica, " ", 278)]
        [InlineData((int)PdfFontFace.Helvetica, "A", 667)]
        [InlineData((int)PdfFontFace.Helvetica, "i", 222)]
        [InlineData((int)PdfFontFace.HelveticaBold, "A", 722)]
        [InlineData((int)PdfFontFace.TimesRoman, "A", 722)]
        [InlineData((int)PdfFontFace.Courier, "Wi", 1200)]
        [InlineData((int)PdfFontFace.CourierBoldOblique, "x", 600)]
        public void Measure(int face, string text, int thousandths)
        {
            // act
            var width = PdfFont.Measure((PdfFontFace)face, PdfFont.Encode(text), 1000);

            // validation
            Assert.Equal(thousandths, width, 0.01f);
        }

        /// <summary>
        /// Tests that the faces of a family are found by weight and slant.
        /// </summary>
        [Theory]
        [InlineData(PdfFontFamily.Helvetica, false, false, "Helvetica")]
        [InlineData(PdfFontFamily.Helvetica, true, true, "Helvetica-BoldOblique")]
        [InlineData(PdfFontFamily.Times, false, true, "Times-Italic")]
        [InlineData(PdfFontFamily.Courier, true, false, "Courier-Bold")]
        public void Resolve(PdfFontFamily family, bool bold, bool italic, string expected)
        {
            // validation
            Assert.Equal(expected, PdfFont.BaseFont(PdfFont.Resolve(family, bold, italic)));
        }

        /// <summary>
        /// Tests the encoding of characters into WinAnsi code points.
        /// </summary>
        [Theory]
        [InlineData("abc", new[] { 0x61, 0x62, 0x63 })]
        [InlineData("\u00FC\u00DF", new[] { 0xFC, 0xDF })]
        [InlineData("\u20AC", new[] { 0x80 })]
        [InlineData("\u201E\u201C", new[] { 0x84, 0x93 })]
        [InlineData("\u2022", new[] { 0x95 })]
        [InlineData("a\u200Bb", new[] { 0x61, 0x62 })]
        [InlineData("\u4E2D", new[] { 0x3F })]
        [InlineData("\U0001F600", new[] { 0x3F })]
        public void Encode(string text, int[] expected)
        {
            // act
            var encoded = PdfFont.Encode(text);

            // validation
            Assert.Equal(expected, encoded.Select(c => (int)c));
        }
    }
}
