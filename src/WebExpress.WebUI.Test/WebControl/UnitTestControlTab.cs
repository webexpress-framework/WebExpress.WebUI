using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the tab control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTab
    {
        /// <summary>
        /// Tests the id property of the tab control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-tab"" data-layout=""default""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-tab"" data-layout=""default""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTab(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

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
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTab(null)
            {
                Layout = layout
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a page to the tab control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTab(null);

            // act
            control.Add(new ControlTabView());

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-webui-tab"" data-layout=""default""><div class=""wx-tab-view""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
