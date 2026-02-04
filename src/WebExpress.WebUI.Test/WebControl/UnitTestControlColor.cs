using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the color control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlColor
    {
        /// <summary>
        /// Tests the id property of the color control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-color""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-color""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlColor(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the color control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-color""></div>")]
        [InlineData("", @"<div class=""wx-webui-color""></div>")]
        [InlineData("red", @"<div class=""wx-webui-color"" data-value=""red""></div>")]
        [InlineData("#ff0000", @"<div class=""wx-webui-color"" data-value=""#ff0000""></div>")]
        public void Color(string color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlColor()
            {
                Color = color
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the color control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-color""></div>")]
        [InlineData("", @"<div class=""wx-webui-color""></div>")]
        [InlineData("info", @"<div class=""wx-webui-color"" data-tooltip=""info""></div>")]
        [InlineData("My Tooltip", @"<div class=""wx-webui-color"" data-tooltip=""My Tooltip""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-webui-color"" data-tooltip=""WebExpress.WebUI""></div>")]
        public void Tooltip(string tooltip, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlColor()
            {
                Tooltip = tooltip
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
