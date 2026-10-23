using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the empty-state control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlEmptyState
    {
        /// <summary>
        /// Tests the id property of the empty-state control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-empty-state""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-empty-state""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlEmptyState(id);

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title and message of the empty-state control.
        /// </summary>
        [Fact]
        public void TitleAndMessage()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlEmptyState()
            {
                Title = _ => "No results",
                Message = _ => "Nothing matches your filter yet."
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-empty-state""><span class=""wx-empty-state-title"">No results</span><span class=""wx-empty-state-message"">Nothing matches your filter yet.</span></div>", html);
        }

        /// <summary>
        /// Tests the title property of the empty-state control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-empty-state""></div>")]
        [InlineData("abc", @"<div class=""wx-empty-state""><span class=""wx-empty-state-title"">abc</span></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-empty-state""><span class=""wx-empty-state-title"">WebExpress.WebUI</span></div>")]
        public void Title(string title, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlEmptyState()
            {
                Title = _ => title
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the message property of the empty-state control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-empty-state""></div>")]
        [InlineData("abc", @"<div class=""wx-empty-state""><span class=""wx-empty-state-message"">abc</span></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-empty-state""><span class=""wx-empty-state-message"">WebExpress.WebUI</span></div>")]
        public void Message(string message, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlEmptyState()
            {
                Message = _ => message
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the call-to-action controls are rendered in their own section.
        /// </summary>
        [Fact]
        public void Actions()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlEmptyState
            (
                null,
                new ControlButton() { Text = _ => "Create" }
            )
            {
                Title = _ => "No results"
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-empty-state""><span class=""wx-empty-state-title"">No results</span><div class=""wx-empty-state-actions""><button*>Create</button></div></div>", html);
        }
    }
}
