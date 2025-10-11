using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the frame control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFrame
    {
        /// <summary>
        /// Tests the id property of the frame control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-frame""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-frame""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFrame(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the frame control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-frame""></div>")]
        [InlineData("http://localhost:8080/abc", @"<div class=""wx-webui-frame"" data-uri=""http://localhost:8080/abc""></div>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFrame()
            {
                Uri = !string.IsNullOrWhiteSpace(uri) ? new UriEndpoint(uri) : null,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the selector property of the frame control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-frame""></div>")]
        [InlineData("#id", @"<div class=""wx-webui-frame"" data-selector=""#id""></div>")]
        public void Selector(string selector, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFrame()
            {
                Selector = selector,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
