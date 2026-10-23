using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the contrast color helper that picks the text color for an author-chosen fill.
    /// </summary>
    public class UnitTestContrastColor
    {
        /// <summary>
        /// Tests that the helper picks the color with the higher contrast ratio on the fill, in
        /// every notation the server resolves, and stays out of the way for the ones it does not.
        /// </summary>
        [Theory]
        [InlineData("#ffffff", "#000")]
        [InlineData("#000000", "#fff")]
        [InlineData("#fff", "#000")]
        [InlineData("#ffd700", "#000")]
        [InlineData("#8b5cf6", "#000")]
        [InlineData("#1a237e", "#fff")]
        [InlineData("rgb(25, 135, 84)", "#000")]
        [InlineData("rgba(33,37,41,0.9)", "#fff")]
        [InlineData("gold", "#000")]
        [InlineData("Navy", "#fff")]
        [InlineData("no-such-color", null)]
        [InlineData("", null)]
        [InlineData(null, null)]
        public void On(string fill, string expected)
        {
            Assert.Equal(expected, ContrastColor.On(fill));
        }

        /// <summary>
        /// Tests that a user color carries the text color that reads on it, while a system color
        /// keeps the stylesheet in charge.
        /// </summary>
        [Theory]
        [InlineData("#ff8800", "background:#ff8800;color:#000;")]
        [InlineData("#123456", "background:#123456;color:#fff;")]
        [InlineData("gold", "background:gold;color:#000;")]
        [InlineData("no-such-color", "background:no-such-color;")]
        public void BackgroundStyle(string color, string expected)
        {
            Assert.Equal(expected, new PropertyColorBackground(color).ToStyle());
        }
    }
}
