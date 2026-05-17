using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the <see cref="BindShow"/> binding class.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestBindShow
    {
        /// <summary>
        /// Verifies that no attributes are emitted when the source is missing.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("  ")]
        public void NullOrEmptySourceProducesNoAttributes(string source)
        {
            // arrange
            var input = new HtmlElementTextContentDiv();
            var bind = new BindShow { Source = source };

            // act
            bind.ApplyUserAttributes(input);

            // validation
            AssertExtensions.EqualWithPlaceholders("<div></div>", input.ToString());
        }

        /// <summary>
        /// Verifies that the source id is normalised with a leading '#'.
        /// </summary>
        [Theory]
        [InlineData("myList")]
        [InlineData("#myList")]
        public void SourceIsNormalisedWithHashPrefix(string source)
        {
            // arrange
            var input = new HtmlElementTextContentDiv();
            var bind = new BindShow { Source = source };

            // act
            bind.ApplyUserAttributes(input);

            // validation
            var html = input.ToString();
            Assert.Contains(@"data-wx-bind=""show""", html);
            Assert.Contains(@"data-wx-source-show=""#myList""", html);
        }

        /// <summary>
        /// Verifies that optional event/condition/detail attributes are emitted
        /// only when supplied.
        /// </summary>
        [Fact]
        public void OptionalAttributesAreEmittedOnlyWhenSet()
        {
            // arrange
            var input = new HtmlElementTextContentDiv();
            var bind = new BindShow
            {
                Source = "src",
                Event = "webexpress.webui.table.select.row",
                Condition = "!=null",
                DetailKey = "rowId"
            };

            // act
            bind.ApplyUserAttributes(input);

            // validation
            var html = input.ToString();
            Assert.Contains(@"data-wx-bind-event-show=""webexpress.webui.table.select.row""", html);
            Assert.Contains(@"data-wx-bind-condition-show=""!=null""", html);
            Assert.Contains(@"data-wx-bind-detail-show=""rowId""", html);
        }

        /// <summary>
        /// Verifies that the bind name is 'show'.
        /// </summary>
        [Fact]
        public void NameIsShow()
        {
            Assert.Equal("show", new BindShow().Name);
        }

        /// <summary>
        /// Verifies that <see cref="BindShow"/> integrates with the
        /// <see cref="Binding"/> aggregator.
        /// </summary>
        [Fact]
        public void CombinedBindingProducesShowAttributes()
        {
            // arrange
            var input = new HtmlElementTextContentDiv();
            var binding = new Binding().Add(new BindShow { Source = "myList" });

            // act
            binding.ApplyUserAttributes(input);

            // validation
            var html = input.ToString();
            Assert.Contains(@"data-wx-bind=""show""", html);
            Assert.Contains(@"data-wx-source-show=""#myList""", html);
        }

        /// <summary>
        /// Verifies that <see cref="BindShow.ToJson"/> returns the expected
        /// shape, including optional keys when set.
        /// </summary>
        [Fact]
        public void ToJsonContainsExpectedKeys()
        {
            // arrange
            var bind = new BindShow
            {
                Source = "myList",
                Event = "webexpress.webui.select.item",
                Condition = "!=null",
                DetailKey = "itemId"
            };

            // act
            var json = bind.ToJson();

            // validation
            Assert.Equal("show", json["bind"]);
            Assert.Equal("#myList", json["source"]);
            Assert.Equal("webexpress.webui.select.item", json["event"]);
            Assert.Equal("!=null", json["condition"]);
            Assert.Equal("itemId", json["detail"]);
        }
    }
}
