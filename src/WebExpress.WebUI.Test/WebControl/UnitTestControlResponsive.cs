using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the responsive control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlResponsive
    {
        /// <summary>
        /// Tests the id property of the responsive control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-responsive""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-responsive""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlResponsive(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the responsive control.
        /// </summary>
        [Theory]
        [InlineData(-1, @"<div class=""wx-webui-responsive""><div class=""wx-responsive-panel-fallback""></div></div>")]
        [InlineData(0, @"<div class=""wx-webui-responsive""><div class=""wx-responsive-panel"" data-breakpoint=""0""></div></div>")]
        [InlineData(600, @"<div class=""wx-webui-responsive""><div class=""wx-responsive-panel"" data-breakpoint=""600""></div></div>")]
        [InlineData(1024, @"<div class=""wx-webui-responsive""><div class=""wx-responsive-panel"" data-breakpoint=""1024""></div></div>")]
        public void Add(int breakpoint, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlResponsive(null);
            var panel = new ControlPanel();

            // act
            control.Add(panel, breakpoint);

            // validation
            var html = control.Render(context, visualTree);

            Assert.Single(control.Panels);
            Assert.Equal(panel, control.Panels.First().Value);
            Assert.Equal(breakpoint, control.Panels.First().Key);
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
