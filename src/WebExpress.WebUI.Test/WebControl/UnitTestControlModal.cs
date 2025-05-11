using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the modal control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlModal
    {
        /// <summary>
        /// Tests the id property of the modal control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-modal"" data-close-label=""Close""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-modal"" data-close-label=""Close""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModal(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header property of the modal control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-modal"" data-close-label=""Close""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-modal"" data-title=""abc"" data-close-label=""Close""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-modal"" data-title=""WebExpress.WebUI"" data-close-label=""Close""></div>")]
        public void Header(string header, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModal(null)
            {
                Header = header
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the size property of the modal control.
        /// </summary>
        [Theory]
        [InlineData(TypeModalSize.Default, @"<div class=""wx-webui-modal"" data-close-label=""Close""></div>")]
        [InlineData(TypeModalSize.Small, @"<div class=""wx-webui-modal"" data-size=""modal-sm"" *></div>")]
        [InlineData(TypeModalSize.Large, @"<div class=""wx-webui-modal"" data-size=""modal-lg"" *></div>")]
        [InlineData(TypeModalSize.ExtraLarge, @"<div class=""wx-webui-modal"" data-size=""modal-xl"" *></div>")]
        [InlineData(TypeModalSize.Fullscreen, @"<div class=""wx-webui-modal"" data-size=""modal-fullscreen"" *></div>")]
        public void Size(TypeModalSize size, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModal(null)
            {
                Size = size
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }
    }
}
