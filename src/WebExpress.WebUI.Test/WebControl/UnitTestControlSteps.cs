using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the steps control and its items.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSteps
    {
        /// <summary>
        /// Tests the id property of the steps control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-steps""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-steps""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSteps(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the vertical property of the steps control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-steps""></div>")]
        [InlineData(true, @"<div class=""wx-steps wx-steps-vertical""></div>")]
        public void Vertical(bool vertical, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSteps()
            {
                Vertical = _ => vertical
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the steps are numbered by their position inside the control.
        /// </summary>
        [Fact]
        public void Numbering()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSteps
            (
                null,
                new ControlStepsItem() { Label = _ => "One", State = _ => TypeStepState.Completed },
                new ControlStepsItem() { Label = _ => "Two", State = _ => TypeStepState.Active }
            );

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-steps""><div class=""wx-steps-item wx-steps-item-completed""><span class=""wx-steps-marker"">*</span>*</div><div class=""wx-steps-item wx-steps-item-active""><span class=""wx-steps-marker"">2</span><div class=""wx-steps-text""><span class=""wx-steps-label"">Two</span></div></div></div>", html);
        }

        /// <summary>
        /// Tests a pending step item rendered standalone.
        /// </summary>
        [Fact]
        public void ItemPending()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlStepsItem()
            {
                Label = _ => "Details",
                Description = _ => "Enter your details"
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-steps-item wx-steps-item-pending""><span class=""wx-steps-marker"">1</span><div class=""wx-steps-text""><span class=""wx-steps-label"">Details</span><span class=""wx-steps-description"">Enter your details</span></div></div>", html);
        }
    }
}
