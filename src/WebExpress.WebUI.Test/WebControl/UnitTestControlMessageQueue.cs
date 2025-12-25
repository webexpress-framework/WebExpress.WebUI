using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the message queue.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlMessageQueue
    {
        /// <summary>
        /// Tests the id property of the message queue control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-message-queue"" role=""status""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-message-queue"" role=""status""></div>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<div id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C"" class=""wx-webui-message-queue"" role=""status""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlMessageQueue(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the id property of the message queue control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-message-queue"" role=""status""></div>")]
        [InlineData("", @"<div class=""wx-webui-message-queue"" role=""status""></div>")]
        [InlineData("http://localhost/abc", @"<div class=""wx-webui-message-queue"" role=""status"" data-uri=""http://localhost/abc""></div>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlMessageQueue(null)
            {
                Uri = !string.IsNullOrEmpty(uri) ? new UriEndpoint(uri) : null,
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
