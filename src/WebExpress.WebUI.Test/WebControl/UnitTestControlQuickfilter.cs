using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the quickfilter control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlQuickfilter
    {
        /// <summary>
        /// Tests the id property of the quickfilter control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-quickfilter"" role=""filter""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-quickfilter"" role=""filter""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlQuickfilter(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a button to the quickfilter control.
        /// </summary>
        [Fact]
        public void AddButton()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlQuickfilter(null);

            // act
            control.Add(new ControlQuickfilterItemButton(null));

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-webui-quickfilter"" role=""filter""><button type=""button"" class=""wx-quickfilter-button""></button></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
