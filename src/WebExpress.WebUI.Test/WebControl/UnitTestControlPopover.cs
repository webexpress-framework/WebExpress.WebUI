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
        [InlineData(null, @"<button class=""wx-webui-popover"" type=""button"" data-wx-toggle=""popover"" data-wx-trigger=""click"" data-wx-placement=""top"" data-wx-title=""Title"" data-wx-content=""Message"">Info</button>")]
        [InlineData("id", @"<button id=""id"" class=""wx-webui-popover"" type=""button"" data-wx-toggle=""popover"" data-wx-trigger=""click"" data-wx-placement=""top"" data-wx-title=""Title"" data-wx-content=""Message"">Info</button>")]
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

            // validation
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

            // validation
            AssertExtensions.EqualWithPlaceholders($@"<button class=""wx-webui-popover"" type=""button"" data-wx-toggle=""popover"" data-wx-trigger=""click"" data-wx-placement=""{expectedValue}"">Info</button>", html);
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

            // validation
            AssertExtensions.EqualWithPlaceholders($@"<button class=""wx-webui-popover"" type=""button"" data-wx-toggle=""popover"" data-wx-trigger=""{expectedValue}"" data-wx-placement=""top"">Info</button>", html);
        }
    }
}
