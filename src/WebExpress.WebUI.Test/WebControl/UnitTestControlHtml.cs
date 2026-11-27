using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the HTML control.
    /// </summary>
    public class UnitTestControlHtml
    {
        /// <summary>
        /// Tests the id property of the HTML control.
        /// </summary>
        [Theory]
        [InlineData(null, null)]
        [InlineData("id", null)]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlHtml(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the html property of the HTML control.
        /// </summary>
        [Theory]
        [InlineData(null, null)]
        [InlineData("<div>abc</div>", @"<div>abc</div>")]
        public void Html(string rawHtml, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlHtml()
            {
                Html = _ => rawHtml
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that markup is sanitized unless it is declared trusted: a value from data put
        /// into the markup ran as script in every visitor's browser.
        /// </summary>
        [Fact]
        public void HtmlIsSanitizedUnlessTrusted()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            const string markup = "<b onclick=\"steal()\">name</b><script>steal()</script>";

            // act
            var sanitized = new ControlHtml { Html = _ => markup }.Render(context, visualTree).ToString();
            var trusted = new ControlHtml { Html = _ => markup, Trusted = true }.Render(context, visualTree).ToString();

            // validation
            Assert.Contains("<b>name</b>", sanitized);
            Assert.DoesNotContain("script", sanitized);
            Assert.DoesNotContain("onclick", sanitized);
            Assert.Equal(markup, trusted);
        }
    }
}
