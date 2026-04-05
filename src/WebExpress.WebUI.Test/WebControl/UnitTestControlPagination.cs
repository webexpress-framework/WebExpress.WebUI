using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the pagination control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPagination
    {
        /// <summary>
        /// Tests the id property of the pagination control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-pagination""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-pagination""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPagination(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the page property of the pagination control.
        /// </summary>
        [Theory]
        [InlineData(0, @"<div class=""wx-webui-pagination""></div>")]
        [InlineData(2, @"<div class=""wx-webui-pagination"" data-page=""2""></div>")]
        public void Page(uint page, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPagination()
            {
                Page = page
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the page property of the pagination control.
        /// </summary>
        [Theory]
        [InlineData(0, @"<div class=""wx-webui-pagination""></div>")]
        [InlineData(5, @"<div class=""wx-webui-pagination"" data-total=""5""></div>")]
        public void Total(uint total, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPagination()
            {
                Total = total
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
