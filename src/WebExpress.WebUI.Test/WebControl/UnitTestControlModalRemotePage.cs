using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the remote modal page control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlModalRemotePage
    {
        /// <summary>
        /// Tests the id property of the remote modal page control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<dialog class=""wx-webui-modal-page"" *></dialog>")]
        [InlineData("id", @"<dialog id=""id"" class=""wx-webui-modal-page"" *></dialog>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalRemotePage(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header property of the remote modal page control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<dialog class=""wx-webui-modal-page"" data-close-label=""Close"">*</dialog>")]
        [InlineData("abc", @"<dialog class=""wx-webui-modal-page""*><div class=""wx-modal-header"">abc</div>*</dialog>")]
        [InlineData("webexpress.webui:plugin.name", @"<dialog class=""wx-webui-modal-page"" *><div class=""wx-modal-header"">WebExpress.WebUI</div>*</dialog>")]
        public void Header(string header, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalRemotePage(null)
            {
                Header = _ => header
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the size property of the remote modal page control.
        /// </summary>
        [Theory]
        [InlineData(TypeModalSize.Default, @"<dialog class=""wx-webui-modal-page"" data-close-label=""Close"">*</dialog>")]
        [InlineData(TypeModalSize.Small, @"<dialog class=""wx-webui-modal-page"" data-size=""modal-sm"" *>*</dialog>")]
        [InlineData(TypeModalSize.Large, @"<dialog class=""wx-webui-modal-page"" data-size=""modal-lg"" *>*</dialog>")]
        [InlineData(TypeModalSize.ExtraLarge, @"<dialog class=""wx-webui-modal-page"" data-size=""modal-xl"" *>*</dialog>")]
        [InlineData(TypeModalSize.Fullscreen, @"<dialog class=""wx-webui-modal-page"" data-size=""modal-fullscreen"" *>*</dialog>")]
        public void Size(TypeModalSize size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalRemotePage(null)
            {
                Size = _ => size
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the uri property of the remote modal page control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<dialog class=""wx-webui-modal-page"" *>*</dialog>")]
        [InlineData("/webui/abc", @"<dialog class=""wx-webui-modal-page"" * data-uri=""/webui/abc"">*</dialog>")]
        public void Uri(string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalRemotePage(null)
            {
                Uri = _ => !string.IsNullOrWhiteSpace(uri) ? new WebExpress.WebCore.WebUri.UriEndpoint(uri) : null
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the selector property of the remote modal page control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<dialog class=""wx-webui-modal-page"" *>*</dialog>")]
        [InlineData("#main", @"<dialog class=""wx-webui-modal-page"" * data-selector=""#main"">*</dialog>")]
        public void Selector(string selector, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalRemotePage(null)
            {
                Selector = _ => selector
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }
    }
}
