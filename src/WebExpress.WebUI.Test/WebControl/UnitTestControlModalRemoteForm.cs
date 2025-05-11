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
        [InlineData(null, @"<div class=""wx-webui-modalform"" *></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-modalform"" *></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
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
        [InlineData(null, @"<div class=""wx-webui-modalform"" data-close-label=""Close""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-modalform"" data-title=""abc"" data-close-label=""Close""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-modalform"" data-title=""WebExpress.WebUI"" data-close-label=""Close""></div>")]
        public void Header(string header, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
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
        [InlineData(TypeModalSize.Default, @"<div class=""wx-webui-modalform"" data-close-label=""Close""></div>")]
        [InlineData(TypeModalSize.Small, @"<div class=""wx-webui-modalform"" data-size=""modal-sm"" *></div>")]
        [InlineData(TypeModalSize.Large, @"<div class=""wx-webui-modalform"" data-size=""modal-lg"" *></div>")]
        [InlineData(TypeModalSize.ExtraLarge, @"<div class=""wx-webui-modalform"" data-size=""modal-xl"" *></div>")]
        [InlineData(TypeModalSize.Fullscreen, @"<div class=""wx-webui-modalform"" data-size=""modal-fullscreen"" *></div>")]
        public void Size(TypeModalSize size, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
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
        [InlineData(null, @"<div class=""wx-webui-modalform"" *></div>")]
        [InlineData("/webui/abc", @"<div class=""wx-webui-modalform"" * data-uri=""/webui/abc""></div>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalRemoteForm(null)
            {
                Uri = !string.IsNullOrWhiteSpace(uri) ? new WebExpress.WebCore.WebUri.UriEndpoint(uri) : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the selector property of the modal page control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-modalform"" *></div>")]
        [InlineData("main", @"<div class=""wx-webui-modalform"" * data-selector=""main""></div>")]
        public void Selector(string selector, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
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
