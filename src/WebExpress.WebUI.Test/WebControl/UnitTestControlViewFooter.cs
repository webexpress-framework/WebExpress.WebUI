using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the view footer control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlViewFooter
    {
        /// <summary>
        /// Tests the id property of the view item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-view-footer""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-view-footer""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlViewFooter(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a item to the view item control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlViewFooter(null);

            // act
            control.Add(new ControlText());

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-view-footer""><div></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

    }
}
