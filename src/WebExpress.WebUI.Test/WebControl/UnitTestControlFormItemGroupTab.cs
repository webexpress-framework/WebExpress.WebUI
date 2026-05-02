using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form item group tab control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemGroupTab
    {
        /// <summary>
        /// Tests the id property of the form item group mix control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-tab"" data-layout=""default""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-tab"" data-layout=""default""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemGroupTab(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form item group mix control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-tab"" data-layout=""default""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-tab"" data-layout=""default""></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemGroupTab()
            {
                Name = name
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the layout property of the tab control.
        /// </summary>
        [Theory]
        [InlineData(TypeLayoutTab.Default, @"<div class=""wx-webui-tab"" data-layout=""default""></div>")]
        [InlineData(TypeLayoutTab.Pill, @"<div class=""wx-webui-tab"" data-layout=""pill""></div>")]
        [InlineData(TypeLayoutTab.Underline, @"<div class=""wx-webui-tab"" data-layout=""underline""></div>")]
        public void Layout(TypeLayoutTab layout, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemGroupTab()
            {
                Layout = layout
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
