using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the modal page control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlModalRemoteForm
    {
        /// <summary>
        /// Tests the id property of the modal page control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-modal-form"" *></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-modal-form"" *></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalRemoteForm(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header property of the modal page control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-modal-form"" data-close-label=""Close"">*</div>")]
        [InlineData("abc", @"<div class=""wx-webui-modal-form"" *><div class=""wx-modal-header"">abc</div>*</div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-modal-form"" *><div class=""wx-modal-header"">WebExpress.WebUI</div>*</div>")]
        public void Header(string header, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalRemoteForm(null)
            {
                Header = header
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the size property of the modal page control.
        /// </summary>
        [Theory]
        [InlineData(TypeModalSize.Default, @"<div class=""wx-webui-modal-form"" data-close-label=""Close"">*</div>")]
        [InlineData(TypeModalSize.Small, @"<div class=""wx-webui-modal-form"" data-size=""modal-sm"" *>*</div>")]
        [InlineData(TypeModalSize.Large, @"<div class=""wx-webui-modal-form"" data-size=""modal-lg"" *>*</div>")]
        [InlineData(TypeModalSize.ExtraLarge, @"<div class=""wx-webui-modal-form"" data-size=""modal-xl"" *>*</div>")]
        [InlineData(TypeModalSize.Fullscreen, @"<div class=""wx-webui-modal-form"" data-size=""modal-fullscreen"" *>*</div>")]
        public void Size(TypeModalSize size, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalRemoteForm(null)
            {
                Size = size
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the uri property of the modal page control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-modal-form"" *>*</div>")]
        [InlineData("/webui/abc", @"<div class=""wx-webui-modal-form"" * data-uri=""/webui/abc"">*</div>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalRemoteForm(null)
            {
                Uri = !string.IsNullOrWhiteSpace(uri) ? new WebCore.WebUri.UriEndpoint(uri) : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the selector property of the modal page control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-modal-form"" *>*</div>")]
        [InlineData("main", @"<div class=""wx-webui-modal-form"" * data-selector=""main"">*</div>")]
        public void Selector(string selector, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalRemoteForm(null)
            {
                Selector = selector
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }
    }
}
