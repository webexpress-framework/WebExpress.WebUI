using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the popover control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPopover
    {
        /// <summary>
        /// Tests the default rendering of the popover control, including the trigger
        /// label and the data attributes the client reads.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""wx-webui-popover"" role=""button"" tabindex=""0"" data-bs-toggle=""popover"" data-bs-trigger=""click"" data-bs-placement=""top"" data-bs-title=""Title"" data-bs-content=""Message"">Info</span>")]
        [InlineData("id", @"<span id=""id"" class=""wx-webui-popover"" role=""button"" tabindex=""0"" data-bs-toggle=""popover"" data-bs-trigger=""click"" data-bs-placement=""top"" data-bs-title=""Title"" data-bs-content=""Message"">Info</span>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPopover(id)
            {
                Text = _ => "Info",
                Title = _ => "Title",
                Message = _ => "Message"
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placement of the popover control.
        /// </summary>
        [Theory]
        [InlineData(TypePopoverPlacement.Top, "top")]
        [InlineData(TypePopoverPlacement.Right, "right")]
        [InlineData(TypePopoverPlacement.Bottom, "bottom")]
        [InlineData(TypePopoverPlacement.Left, "left")]
        public void Placement(TypePopoverPlacement placement, string expectedValue)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPopover()
            {
                Text = _ => "Info",
                Placement = _ => placement
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders($@"<span class=""wx-webui-popover"" role=""button"" tabindex=""0"" data-bs-toggle=""popover"" data-bs-trigger=""click"" data-bs-placement=""{expectedValue}"">Info</span>", html);
        }

        /// <summary>
        /// Tests the trigger of the popover control.
        /// </summary>
        [Theory]
        [InlineData(TypePopoverTrigger.Click, "click")]
        [InlineData(TypePopoverTrigger.Hover, "hover focus")]
        [InlineData(TypePopoverTrigger.Focus, "focus")]
        public void Trigger(TypePopoverTrigger trigger, string expectedValue)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPopover()
            {
                Text = _ => "Info",
                Trigger = _ => trigger
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders($@"<span class=""wx-webui-popover"" role=""button"" tabindex=""0"" data-bs-toggle=""popover"" data-bs-trigger=""{expectedValue}"" data-bs-placement=""top"">Info</span>", html);
        }
    }
}
