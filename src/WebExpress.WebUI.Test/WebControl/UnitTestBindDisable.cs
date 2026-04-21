using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the BindDisable binding class.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestBindDisable
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
            var bind = new BindDisable { Source = source, Condition = condition };

            // act
            bind.ApplyUserAttributes(input);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, input.ToString());
        }

        /// <summary>
        /// Tests that ApplyUserAttributes normalises the source ID by adding a leading '#'.
        /// </summary>
        [Theory]
        [InlineData("mySelect",  @"<input type=""text"" data-wx-bind=""disable"" data-wx-source-disable=""#mySelect"" data-wx-bind-condition-disable=""yes"">")]
        [InlineData("#mySelect", @"<input type=""text"" data-wx-bind=""disable"" data-wx-source-disable=""#mySelect"" data-wx-bind-condition-disable=""yes"">")]
        public void SourceIsNormalisedWithHashPrefix(string source, string expected)
        {
            // arrange
            var input = new HtmlElementFieldInput { Type = "text" };
            var bind = new BindDisable { Source = source, Condition = "yes" };

            // act
            bind.ApplyUserAttributes(input);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, input.ToString());
        }

        /// <summary>
        /// Tests that ApplyUserAttributes writes the condition expression to the correct attribute.
        /// </summary>
        [Theory]
        [InlineData("active",   @"<input type=""text"" data-wx-bind=""disable"" data-wx-source-disable=""#ctrl"" data-wx-bind-condition-disable=""active"">")]
        [InlineData(">=10",     @"<input type=""text"" data-wx-bind=""disable"" data-wx-source-disable=""#ctrl"" data-wx-bind-condition-disable="">=10"">")]
        [InlineData("!=done",   @"<input type=""text"" data-wx-bind=""disable"" data-wx-source-disable=""#ctrl"" data-wx-bind-condition-disable=""!=done"">")]
        [InlineData("/^foo/i",  @"<input type=""text"" data-wx-bind=""disable"" data-wx-source-disable=""#ctrl"" data-wx-bind-condition-disable=""/^foo/i"">")]
        [InlineData("",         @"<input type=""text"" data-wx-bind=""disable"" data-wx-source-disable=""#ctrl"">")]
        [InlineData(null,       @"<input type=""text"" data-wx-bind=""disable"" data-wx-source-disable=""#ctrl"">")]
        public void ConditionAttributeIsSetCorrectly(string condition, string expected)
        {
            // arrange
            var input = new HtmlElementFieldInput { Type = "text" };
            var bind = new BindDisable { Source = "ctrl", Condition = condition };

            // act
            bind.ApplyUserAttributes(input);

            // assert
            AssertExtensions.EqualWithPlaceholders(expected, input.ToString());
        }

        /// <summary>
        /// Tests that the binding name is 'disable'.
        /// </summary>
        [Fact]
        public void NameIsDisable()
        {
            Assert.Equal("disable", new BindDisable().Name);
        }

        /// <summary>
        /// Tests that ApplyUserAttributes with Binding produces the condition attribute.
        /// </summary>
        [Fact]
        public void CombinedBindingProducesConditionAttribute()
        {
            // arrange
            var input = new HtmlElementFieldInput { Type = "text" };
            var binding = new Binding().Add(new BindDisable { Source = "ctrl", Condition = "yes" });

            // act
            binding.ApplyUserAttributes(input);

            // assert
            var html = input.ToString();
            Assert.Contains(@"data-wx-bind=""disable""", html);
            Assert.Contains(@"data-wx-source-disable=""#ctrl""", html);
            Assert.Contains(@"data-wx-bind-condition-disable=""yes""", html);
        }

        /// <summary>
        /// Tests that ToJson returns the correct structure.
        /// </summary>
        [Fact]
        public void ToJsonContainsExpectedKeys()
        {
            // arrange
            var bind = new BindDisable { Source = "ctrl", Condition = "yes" };

            // act
            var json = bind.ToJson();

            // assert
            Assert.Equal("disable", json["bind"]);
            Assert.Equal("#ctrl", json["source"]);
            Assert.Equal("yes", json["condition"]);
        }

        /// <summary>
        /// Tests that combining BindHide and BindDisable in one Binding produces
        /// a data-wx-bind attribute covering both names.
        /// </summary>
        [Fact]
        public void CombinedHideAndDisableBindingProducesBothNames()
        {
            // arrange
            var input = new HtmlElementFieldInput { Type = "text" };
            var binding = new Binding()
                .Add(new BindHide    { Source = "srcA", Condition = "1" })
                .Add(new BindDisable { Source = "srcB", Condition = "2" });

            // act
            binding.ApplyUserAttributes(input);

            // assert
            var html = input.ToString();
            Assert.Contains("hide",    html);
            Assert.Contains("disable", html);
            Assert.Contains(@"data-wx-source-hide=""#srcA""",    html);
            Assert.Contains(@"data-wx-source-disable=""#srcB""", html);
        }
    }
}
