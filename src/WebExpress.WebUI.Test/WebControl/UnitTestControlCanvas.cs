using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the canvas control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlCanvas
    {
        /// <summary>
        /// Tests the id property of the canvas control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<canvas class=""wx-canvas"">")]
        [InlineData("id", @"<canvas id=""id"" class=""wx-canvas"">")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCanvas(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the canvas control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<canvas class=""wx-canvas"">")]
        [InlineData(TypeColorBackground.Primary, @"<canvas class=""wx-canvas bg-primary"">")]
        [InlineData(TypeColorBackground.Secondary, @"<canvas class=""wx-canvas bg-secondary"">")]
        [InlineData(TypeColorBackground.Warning, @"<canvas class=""wx-canvas bg-warning"">")]
        [InlineData(TypeColorBackground.Danger, @"<canvas class=""wx-canvas bg-danger"">")]
        [InlineData(TypeColorBackground.Dark, @"<canvas class=""wx-canvas bg-dark"">")]
        [InlineData(TypeColorBackground.Light, @"<canvas class=""wx-canvas bg-light"">")]
        [InlineData(TypeColorBackground.Highlight, @"<canvas class=""wx-canvas bg-highlight"">")]
        [InlineData(TypeColorBackground.Transparent, @"<canvas class=""wx-canvas bg-transparent"">")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCanvas()
            {
                BackgroundColor = _ => new PropertyColorBackground(backgroundColor)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the width property of the canvas control.
        /// </summary>
        [Theory]
        [InlineData(TypeWidth.Default, @"<canvas class=""wx-canvas"">")]
        [InlineData(TypeWidth.TwentyFive, @"<canvas class=""wx-canvas w-25"">")]
        [InlineData(TypeWidth.Fifty, @"<canvas class=""wx-canvas w-50"">")]
        [InlineData(TypeWidth.SeventyFive, @"<canvas class=""wx-canvas w-75"">")]
        [InlineData(TypeWidth.OneHundred, @"<canvas class=""wx-canvas w-100"">")]
        public void Width(TypeWidth width, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCanvas()
            {
                Width = _ => width,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the height property of the canvas control.
        /// </summary>
        [Theory]
        [InlineData(TypeHeight.Default, @"<canvas class=""wx-canvas"">")]
        [InlineData(TypeHeight.TwentyFive, @"<canvas class=""wx-canvas h-25"">")]
        [InlineData(TypeHeight.Fifty, @"<canvas class=""wx-canvas h-50"">")]
        [InlineData(TypeHeight.SeventyFive, @"<canvas class=""wx-canvas h-75"">")]
        [InlineData(TypeHeight.OneHundred, @"<canvas class=""wx-canvas h-100"">")]
        public void Height(TypeHeight height, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCanvas()
            {
                Height = _ => height,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
