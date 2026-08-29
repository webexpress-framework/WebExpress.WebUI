using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the <see cref="BindUpload"/> binding class, which declares on a data control that
    /// it shows what an upload control uploaded.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestBindUpload
    {
        /// <summary>
        /// Verifies that an incomplete declaration stays inert. Without a source there is no
        /// upload control to follow, so emitting the bind would only make the client warn about
        /// a declaration the page cannot act on.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void MissingSourceEmitsNothing(string source)
        {
            // arrange
            var input = new HtmlElementTextContentDiv();
            var bind = new BindUpload { Source = source };

            // act
            bind.ApplyUserAttributes(input);

            // validation
            var html = input.ToString();
            Assert.DoesNotContain("data-wx-bind", html);
            Assert.DoesNotContain("data-wx-source-upload", html);
        }

        /// <summary>
        /// Verifies that the source id is normalised with a leading '#', so a caller may pass
        /// the plain control id.
        /// </summary>
        [Theory]
        [InlineData("myUpload")]
        [InlineData("#myUpload")]
        public void SourceIsNormalisedWithHashPrefix(string source)
        {
            // arrange
            var input = new HtmlElementTextContentDiv();
            var bind = new BindUpload { Source = source };

            // act
            bind.ApplyUserAttributes(input);

            // validation
            var html = input.ToString();
            Assert.Contains(@"data-wx-bind=""upload""", html);
            Assert.Contains(@"data-wx-source-upload=""#myUpload""", html);
        }

        /// <summary>
        /// Verifies that the bind name is 'upload', which is the name the client registry
        /// resolves the bind implementation by.
        /// </summary>
        [Fact]
        public void NameIsUpload()
        {
            Assert.Equal("upload", new BindUpload().Name);
        }
    }
}
