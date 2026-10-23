using WebExpress.WebUI.WebPdf;

namespace WebExpress.WebUI.Test.WebPdf
{
    /// <summary>
    /// Tests reading the css colors a stored editor value carries.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestPdfColor
    {
        /// <summary>
        /// Tests the notations that name a color.
        /// </summary>
        [Theory]
        [InlineData("#0d6efd", 13, 110, 253)]
        [InlineData("#FFF", 255, 255, 255)]
        [InlineData("#f00c", 255, 0, 0)]
        [InlineData("#11223380", 17, 34, 51)]
        [InlineData("rgb(214, 51, 132)", 214, 51, 132)]
        [InlineData("rgba(0, 0, 0, 0.5)", 0, 0, 0)]
        [InlineData("rgb(100% 0% 50%)", 255, 0, 127)]
        [InlineData("Navy", 0, 0, 128)]
        [InlineData(" red ", 255, 0, 0)]
        public void Parse(string value, byte r, byte g, byte b)
        {
            // act
            var parsed = PdfColor.TryParse(value, out var color);

            // validation
            Assert.True(parsed);
            Assert.Equal(new PdfColor(r, g, b), color);
        }

        /// <summary>
        /// Tests that values naming no visible color are rejected, so a transparent
        /// background does not turn black.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("transparent")]
        [InlineData("rgba(0, 0, 0, 0)")]
        [InlineData("#00000000")]
        [InlineData("#12")]
        [InlineData("inherit")]
        [InlineData("var(--wx-primary)")]
        public void Reject(string value)
        {
            // act
            var parsed = PdfColor.TryParse(value, out _);

            // validation
            Assert.False(parsed);
        }

        /// <summary>
        /// Tests the hexadecimal representation.
        /// </summary>
        [Fact]
        public void ToStringHex()
        {
            // validation
            Assert.Equal("#0d6efd", new PdfColor(13, 110, 253).ToString());
        }
    }
}
