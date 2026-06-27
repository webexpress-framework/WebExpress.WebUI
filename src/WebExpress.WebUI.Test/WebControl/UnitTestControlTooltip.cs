using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the tooltip control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTooltip
    {
        /// <summary>
        /// Tests the default rendering of the tooltip control, including the trigger
        /// label and the data attributes the client reads.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""wx-webui-tooltip"" tabindex=""0"" data-bs-toggle=""tooltip"" data-bs-placement=""top"" data-bs-title=""More info"">Help</span>")]
        [InlineData("id", @"<span id=""id"" class=""wx-webui-tooltip"" tabindex=""0"" data-bs-toggle=""tooltip"" data-bs-placement=""top"" data-bs-title=""More info"">Help</span>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTooltip(id)
            {
                Text = _ => "Help",
                Title = _ => "More info"
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placement of the tooltip control.
        /// </summary>
        [Theory]
        [InlineData(TypeTooltipPlacement.Top, "top")]
        [InlineData(TypeTooltipPlacement.Right, "right")]
        [InlineData(TypeTooltipPlacement.Bottom, "bottom")]
        [InlineData(TypeTooltipPlacement.Left, "left")]
        public void Placement(TypeTooltipPlacement placement, string expectedValue)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTooltip()
            {
                Text = _ => "Help",
                Title = _ => "More info",
                Placement = _ => placement
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders($@"<span class=""wx-webui-tooltip"" tabindex=""0"" data-bs-toggle=""tooltip"" data-bs-placement=""{expectedValue}"" data-bs-title=""More info"">Help</span>", html);
        }
    }
}
