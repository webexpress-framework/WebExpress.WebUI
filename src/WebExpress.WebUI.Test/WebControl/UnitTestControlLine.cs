using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the image control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlLine
    {
        /// <summary>
        /// Tests the id property of the line control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<hr>")]
        [InlineData("id", @"<hr id=""id"">")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLine(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            Assert.Equal(expected, html.Trim());
        }

        /// <summary>
        /// Tests the color property of the line control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorLine.Default, @"<hr>")]
        [InlineData(TypeColorLine.Primary, @"<hr class=""text-primary"">")]
        [InlineData(TypeColorLine.Secondary, @"<hr class=""text-secondary"">")]
        [InlineData(TypeColorLine.Info, @"<hr class=""text-info"">")]
        [InlineData(TypeColorLine.Warning, @"<hr class=""text-warning"">")]
        [InlineData(TypeColorLine.Danger, @"<hr class=""text-danger"">")]
        [InlineData(TypeColorLine.Light, @"<hr class=""text-light"">")]
        [InlineData(TypeColorLine.Highlight, @"<hr class=""text-highlight"">")]
        [InlineData(TypeColorLine.Dark, @"<hr class=""text-dark"">")]
        public void Color(TypeColorLine color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLine()
            {
                Color = new PropertyColorLine(color)
            };

            // act
            var html = control.Render(context, visualTree);

            Assert.Equal(expected, html.Trim());
        }
    }
}
