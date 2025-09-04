using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the date control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlDate
    {
        /// <summary>
        /// Tests the id property of the avatar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-date""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-date""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDate(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the format property of the date control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-date""></div>")]
        [InlineData("yyyy-mm-dd", @"<div class=""wx-webui-date"" data-format=""yyyy-mm-dd""></div>")]
        public void Format(string format, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDate(null)
            {
                Format = format
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the format property of the date control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-date""></div>")]
        [InlineData("", @"<div class=""wx-webui-date""></div>")]
        public void Date(string date, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDate(null)
            {
                Date = string.IsNullOrWhiteSpace(date) ? default : DateTime.Parse(date)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
