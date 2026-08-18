using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the <see cref="BindPaging"/> binding class, which declares on a data control that
    /// it follows a pager.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestBindPaging
    {
        /// <summary>
        /// Verifies that the bind is emitted even without a source. Unlike the other source
        /// binds it does not fall silent, which is what lets the client report the incomplete
        /// declaration rather than leaving a pager that quietly does nothing.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void MissingSourceStillDeclaresTheBind(string source)
        {
            // arrange
            var input = new HtmlElementTextContentDiv();
            var bind = new BindPaging { Source = source };

            // act
            bind.ApplyUserAttributes(input);

            // validation
            var html = input.ToString();
            Assert.Contains(@"data-wx-bind=""paging""", html);
            Assert.DoesNotContain("data-wx-source-paging", html);
        }

        /// <summary>
        /// Verifies that the source id is normalised with a leading '#', so a caller may pass
        /// the plain control id.
        /// </summary>
        [Theory]
        [InlineData("myPager")]
        [InlineData("#myPager")]
        public void SourceIsNormalisedWithHashPrefix(string source)
        {
            // arrange
            var input = new HtmlElementTextContentDiv();
            var bind = new BindPaging { Source = source };

            // act
            bind.ApplyUserAttributes(input);

            // validation
            var html = input.ToString();
            Assert.Contains(@"data-wx-bind=""paging""", html);
            Assert.Contains(@"data-wx-source-paging=""#myPager""", html);
        }

        /// <summary>
        /// Verifies that the bind name is 'paging', which is the name the client registry
        /// resolves the bind implementation by.
        /// </summary>
        [Fact]
        public void NameIsPaging()
        {
            Assert.Equal("paging", new BindPaging().Name);
        }
    }
}
