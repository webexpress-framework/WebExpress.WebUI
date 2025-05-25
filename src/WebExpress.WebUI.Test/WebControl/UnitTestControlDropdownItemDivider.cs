using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the dropdown item divider control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlDropdownItemDivider
    {
        /// <summary>
        /// Tests the id property of the dropdown item divider control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-dropdownbutton-divider"" role=""separator""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-dropdownbutton-divider"" role=""separator""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdownItemDivider(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
