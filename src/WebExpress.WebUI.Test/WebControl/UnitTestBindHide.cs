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
        public void NullOrEmptySourceProducesNoAttributes(string source, string condition, string expected)
        {
            // arrange
            var input = new HtmlElementFieldInput { Type = "text" };
            var bind = new BindHide { Source = source, Condition = condition };

            // act
            bind.ApplyUserAttributes(input);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, input.ToString());
        }

        /// <summary>
        /// Tests that ApplyUserAttributes normalises the source ID by adding a leading '#'.
        /// </summary>
        [Theory]
        [InlineData("mySelect", @"<input type=""text"" data-wx-bind=""hide"" data-wx-source-hide=""#mySelect"" data-wx-bind-condition-hide=""yes"">")]
        [InlineData("#mySelect", @"<input type=""text"" data-wx-bind=""hide"" data-wx-source-hide=""#mySelect"" data-wx-bind-condition-hide=""yes"">")]
        public void SourceIsNormalisedWithHashPrefix(string source, string expected)
        {
            // arrange
            var input = new HtmlElementFieldInput { Type = "text" };
            var bind = new BindHide { Source = source, Condition = "yes" };

            // act
            bind.ApplyUserAttributes(input);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, input.ToString());
        }

        /// <summary>
        /// Tests that ApplyUserAttributes writes the condition expression to the correct attribute.
        /// </summary>
        [Theory]
        [InlineData("active", @"<input type=""text"" data-wx-bind=""hide"" data-wx-source-hide=""#ctrl"" data-wx-bind-condition-hide=""active"">")]
        [InlineData(">=10", @"<input type=""text"" data-wx-bind=""hide"" data-wx-source-hide=""#ctrl"" data-wx-bind-condition-hide="">=10"">")]
        [InlineData("!=done", @"<input type=""text"" data-wx-bind=""hide"" data-wx-source-hide=""#ctrl"" data-wx-bind-condition-hide=""!=done"">")]
        [InlineData("/^foo/i", @"<input type=""text"" data-wx-bind=""hide"" data-wx-source-hide=""#ctrl"" data-wx-bind-condition-hide=""/^foo/i"">")]
        [InlineData("", @"<input type=""text"" data-wx-bind=""hide"" data-wx-source-hide=""#ctrl"">")]
        [InlineData(null, @"<input type=""text"" data-wx-bind=""hide"" data-wx-source-hide=""#ctrl"">")]
        public void ConditionAttributeIsSetCorrectly(string condition, string expected)
        {
            // arrange
            var input = new HtmlElementFieldInput { Type = "text" };
            var bind = new BindHide { Source = "ctrl", Condition = condition };

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
        /// Tests that ApplyUserAttributes with Binding produces the condition attribute.
        /// </summary>
        [Fact]
        public void CombinedBindingProducesConditionAttribute()
        {
            // arrange
            var input = new HtmlElementFieldInput { Type = "text" };
            var binding = new Binding().Add(new BindHide { Source = "ctrl", Condition = "yes" });

            // act
            binding.ApplyUserAttributes(input);

            // assert
            var html = input.ToString();
            Assert.Contains(@"data-wx-bind=""hide""", html);
            Assert.Contains(@"data-wx-source-hide=""#ctrl""", html);
            Assert.Contains(@"data-wx-bind-condition-hide=""yes""", html);
        }

        /// <summary>
        /// Tests that ToJson returns the correct structure.
        /// </summary>
        [Fact]
        public void ToJsonContainsExpectedKeys()
        {
            // arrange
            var bind = new BindHide { Source = "ctrl", Condition = "yes" };

            // act
            var json = bind.ToJson();

            // assert
            Assert.Equal("hide", json["bind"]);
            Assert.Equal("#ctrl", json["source"]);
            Assert.Equal("yes", json["condition"]);
        }
    }
}
