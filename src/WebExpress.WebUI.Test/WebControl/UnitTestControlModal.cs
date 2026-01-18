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
        [InlineData(null, @"<div class=""wx-webui-modal"" data-close-label=""Close"">*</div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-modal"" data-close-label=""Close"">*</div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModal(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header property of the modal control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-modal"" *>*</div>")]
        [InlineData("abc", @"<div class=""wx-webui-modal"" *><div class=""wx-modal-header"">abc</div>*</div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-modal"" *><div class=""wx-modal-header"">WebExpress.WebUI</div>*</div>")]
        public void Header(string header, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModal(null)
            {
                Header = header
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the size property of the modal control.
        /// </summary>
        [Theory]
        [InlineData(TypeModalSize.Default, @"<div class=""wx-webui-modal"" data-close-label=""Close"">*</div>")]
        [InlineData(TypeModalSize.Small, @"<div class=""wx-webui-modal"" data-size=""modal-sm"" *>*</div>")]
        [InlineData(TypeModalSize.Large, @"<div class=""wx-webui-modal"" data-size=""modal-lg"" *>*</div>")]
        [InlineData(TypeModalSize.ExtraLarge, @"<div class=""wx-webui-modal"" data-size=""modal-xl"" *>*</div>")]
        [InlineData(TypeModalSize.Fullscreen, @"<div class=""wx-webui-modal"" data-size=""modal-fullscreen"" *>*</div>")]
        public void Size(TypeModalSize size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModal(null)
            {
                Size = size
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }
    }
}
