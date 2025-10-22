using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the HTML control.
    /// </summary>
    [Collection("NonParallelTests")]
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
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlHtml(id)
            {
            };

            // test execution
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
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlHtml()
            {
                Html = rawHtml
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
