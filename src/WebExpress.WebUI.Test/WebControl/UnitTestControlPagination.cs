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
        [InlineData(null, @"<ul class=""pagination""><li class=""page-item disabled""><a class=""link page-link""><i class=""fas fa-angle-left""></i></a></li><li class=""page-item""><a class=""link page-link"" href=""?offset=%2D1"">0</a></li><li class=""page-item disabled""><a class=""link page-link""><i class=""fas fa-angle-right""></i></a></li></ul>")]
        [InlineData("id", @"<ul id=""id"" class=""pagination"">*</ul>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPagination(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

    }
}
