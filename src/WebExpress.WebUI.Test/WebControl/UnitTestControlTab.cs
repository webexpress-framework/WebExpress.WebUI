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
        [InlineData(null, @"<div class=""wx-webui-tab""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-tab""></div>")]
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
            var expected = @"<div class=""wx-webui-tab""><div class=""wx-tab-view""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
