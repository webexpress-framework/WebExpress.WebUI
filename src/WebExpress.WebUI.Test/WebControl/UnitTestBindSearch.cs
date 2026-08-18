using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the <see cref="BindSearch"/> binding class, which declares on a data control that
    /// it follows a search box.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestBindSearch
    {
        /// <summary>
        /// Verifies that no attributes are emitted when the source is missing. A search bind
        /// that names no box has nothing to follow, and emitting the bind alone would leave the
        /// client resolving a selector that is not there.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("  ")]
        public void NullOrEmptySourceProducesNoAttributes(string source)
        {
            // arrange
            var input = new HtmlElementTextContentDiv();
            var bind = new BindSearch { Source = source };

            // act
            bind.ApplyUserAttributes(input);

            // validation
            AssertExtensions.EqualWithPlaceholders("<div></div>", input.ToString());
        }

        /// <summary>
        /// Verifies that the source id is normalised with a leading '#', so a caller may pass
        /// the plain control id.
        /// </summary>
        [Theory]
        [InlineData("mySearch")]
        [InlineData("#mySearch")]
        public void SourceIsNormalisedWithHashPrefix(string source)
        {
            // arrange
            var input = new HtmlElementTextContentDiv();
            var bind = new BindSearch { Source = source };

            // act
            bind.ApplyUserAttributes(input);

            // validation
            var html = input.ToString();
            Assert.Contains(@"data-wx-bind=""search""", html);
            Assert.Contains(@"data-wx-source-search=""#mySearch""", html);
        }

        /// <summary>
        /// Verifies that the bind name is 'search', which is the name the client registry
        /// resolves the bind implementation by.
        /// </summary>
        [Fact]
        public void NameIsSearch()
        {
            Assert.Equal("search", new BindSearch().Name);
        }

        /// <summary>
        /// Verifies that the bind integrates with the <see cref="Binding"/> aggregator, which is
        /// how a data control declares several binds at once.
        /// </summary>
        [Fact]
        public void CombinedBindingProducesSearchAttributes()
        {
            // arrange
            var input = new HtmlElementTextContentDiv();
            var binding = new Binding()
                .Add(new BindSearch { Source = "mySearch" })
                .Add(new BindPaging { Source = "myPager" });

            // act
            binding.ApplyUserAttributes(input);

            // validation
            var html = input.ToString();
            Assert.Contains(@"data-wx-source-search=""#mySearch""", html);
            Assert.Contains(@"data-wx-source-paging=""#myPager""", html);
        }
    }
}
