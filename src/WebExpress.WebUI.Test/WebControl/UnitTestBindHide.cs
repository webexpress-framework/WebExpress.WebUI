using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the BindHide binding class.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestBindHide
    {
        /// <summary>
        /// Tests that ApplyUserAttributes sets no attributes when Source is null.
        /// </summary>
        [Theory]
        [InlineData(null, "trigger", @"<input type=""text"">")]
        [InlineData("", "trigger", @"<input type=""text"">")]
        [InlineData("  ", "trigger", @"<input type=""text"">")]
        public void NullOrEmptySourceProducesNoAttributes(string source, string value, string expected)
        {
            // arrange
            var input = new HtmlElementFieldInput { Type = "text" };
            var bind = new BindHide { Source = source, Value = value };

            // act
            bind.ApplyUserAttributes(input);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, input.ToString());
        }

        /// <summary>
        /// Tests that ApplyUserAttributes normalises the source ID by adding a leading '#'.
        /// </summary>
        [Theory]
        [InlineData("mySelect", @"<input type=""text"" data-wx-bind=""hide"" data-wx-source-hide=""#mySelect"" data-wx-bind-value-hide=""yes"">")]
        [InlineData("#mySelect", @"<input type=""text"" data-wx-bind=""hide"" data-wx-source-hide=""#mySelect"" data-wx-bind-value-hide=""yes"">")]
        public void SourceIsNormalisedWithHashPrefix(string source, string expected)
        {
            // arrange
            var input = new HtmlElementFieldInput { Type = "text" };
            var bind = new BindHide { Source = source, Value = "yes" };

            // act
            bind.ApplyUserAttributes(input);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, input.ToString());
        }

        /// <summary>
        /// Tests that ApplyUserAttributes sets the trigger value attribute correctly.
        /// </summary>
        [Theory]
        [InlineData("active", @"<input type=""text"" data-wx-bind=""hide"" data-wx-source-hide=""#ctrl"" data-wx-bind-value-hide=""active"">")]
        [InlineData("", @"<input type=""text"" data-wx-bind=""hide"" data-wx-source-hide=""#ctrl"">")]
        [InlineData(null, @"<input type=""text"" data-wx-bind=""hide"" data-wx-source-hide=""#ctrl"">")]
        public void ValueAttributeIsSetCorrectly(string value, string expected)
        {
            // arrange
            var input = new HtmlElementFieldInput { Type = "text" };
            var bind = new BindHide { Source = "ctrl", Value = value };

            // act
            bind.ApplyUserAttributes(input);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, input.ToString());
        }

        /// <summary>
        /// Tests that the binding name is 'hide'.
        /// </summary>
        [Fact]
        public void NameIsHide()
        {
            Assert.Equal("hide", new BindHide().Name);
        }

        /// <summary>
        /// Tests that ApplyUserAttributes with Binding produces a combined data-wx-bind attribute.
        /// </summary>
        [Fact]
        public void CombinedBindingProducesCommaSeperatedBindAttribute()
        {
            // arrange
            var input = new HtmlElementFieldInput { Type = "text" };
            var binding = new Binding().Add(new BindHide { Source = "ctrl", Value = "yes" });

            // act
            binding.ApplyUserAttributes(input);

            // assert
            var html = input.ToString();
            Assert.Contains(@"data-wx-bind=""hide""", html);
            Assert.Contains(@"data-wx-source-hide=""#ctrl""", html);
            Assert.Contains(@"data-wx-bind-value-hide=""yes""", html);
        }

        /// <summary>
        /// Tests that ToJson returns the correct structure.
        /// </summary>
        [Fact]
        public void ToJsonContainsExpectedKeys()
        {
            // arrange
            var bind = new BindHide { Source = "ctrl", Value = "yes" };

            // act
            var json = bind.ToJson();

            // assert
            Assert.Equal("hide", json["bind"]);
            Assert.Equal("#ctrl", json["source"]);
            Assert.Equal("yes", json["value"]);
        }
    }
}
