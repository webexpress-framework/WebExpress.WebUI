using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the skeleton control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSkeleton
    {
        /// <summary>
        /// Tests the id and the default (three text lines) of the skeleton control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-skeleton wx-skeleton-text wx-skeleton-animated"" aria-hidden=""true""><span class=""wx-skeleton-line""></span><span class=""wx-skeleton-line""></span><span class=""wx-skeleton-line""></span></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-skeleton wx-skeleton-text wx-skeleton-animated"" aria-hidden=""true""><span class=""wx-skeleton-line""></span><span class=""wx-skeleton-line""></span><span class=""wx-skeleton-line""></span></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSkeleton(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the number of lines of the text skeleton.
        /// </summary>
        [Fact]
        public void Lines()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSkeleton()
            {
                Lines = _ => 2
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-skeleton wx-skeleton-text wx-skeleton-animated"" aria-hidden=""true""><span class=""wx-skeleton-line""></span><span class=""wx-skeleton-line""></span></div>", html);
        }

        /// <summary>
        /// Tests the shape of the skeleton control.
        /// </summary>
        [Theory]
        [InlineData(TypeSkeleton.Circle, @"<div class=""wx-skeleton wx-skeleton-circle wx-skeleton-animated"" aria-hidden=""true""></div>")]
        [InlineData(TypeSkeleton.Rectangle, @"<div class=""wx-skeleton wx-skeleton-rect wx-skeleton-animated"" aria-hidden=""true""></div>")]
        public void Type(TypeSkeleton type, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSkeleton()
            {
                Type = _ => type
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the animation can be turned off.
        /// </summary>
        [Fact]
        public void NotAnimated()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSkeleton()
            {
                Type = _ => TypeSkeleton.Circle,
                Animated = _ => false
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-skeleton wx-skeleton-circle"" aria-hidden=""true""></div>", html);
        }
    }
}
