using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebMarkdown;

namespace WebExpress.WebUI.Test.WebMarkdown
{
    /// <summary>
    /// Tests that Markdown written by a user cannot put script into the page of another user.
    /// </summary>
    public class UnitTestMarkdownSecurity
    {
        /// <summary>
        /// Renders Markdown to html.
        /// </summary>
        /// <param name="markdown">The Markdown.</param>
        /// <returns>The html.</returns>
        private static string Render(string markdown)
        {
            _ = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();

            return MarkdownParser.Parse(markdown).ConvertToHtml(renderContext).ToString();
        }

        /// <summary>
        /// Verifies that no script vector survives the conversion.
        /// </summary>
        /// <param name="markdown">The Markdown.</param>
        /// <param name="forbidden">A fragment that must not appear in the html.</param>
        [Theory]
        [InlineData("<script>alert(1)</script>", "<script")]
        [InlineData("a <img src=x onerror=alert(1)> b", "<img")]
        [InlineData("<a href=\"javascript:alert(1)\">x</a>", "javascript:")]
        [InlineData("[click](javascript:alert(1))", "href=\"javascript")]
        [InlineData("[click](JaVaScRiPt:alert(1))", "href=\"JaVaScRiPt")]
        [InlineData("![x](javascript:alert(1))", "src=\"javascript")]
        [InlineData("![x](data:image/svg+xml,<svg onload=alert(1)>)", "src=\"data:image/svg")]
        [InlineData("text <b onmouseover=alert(1)>bold</b>", "onmouseover")]
        [InlineData("plain <text> & more", "<text>")]
        public void ScriptVectorsAreRemoved(string markdown, string forbidden)
        {
            Assert.DoesNotContain(forbidden, Render(markdown), StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Verifies that harmless links, images and inline html remain.
        /// </summary>
        [Fact]
        public void HarmlessContentRemains()
        {
            // act
            var html = Render("[home](https://example.com) ![logo](/logo.png) <b>bold</b>");

            // validation
            Assert.Contains("href=\"https://example.com\"", html);
            Assert.Contains("src=\"/logo.png\"", html);
            Assert.Contains("<b>bold</b>", html);
        }
    }
}
