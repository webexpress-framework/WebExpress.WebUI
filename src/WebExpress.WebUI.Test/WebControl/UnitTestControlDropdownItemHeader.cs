using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the dropdown item header control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlDropdownItemHeader
    {
        /// <summary>
        /// Tests the id property of the dropdown item header control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-dropdown-header"" role=""heading""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-dropdown-header"" role=""heading""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdownItemHeader(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the dropdown item header control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-dropdown-header"" role=""heading""></div>")]
        [InlineData("abc", @"<div class=""wx-dropdown-header"" role=""heading"">abc</div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-dropdown-header"" role=""heading"">WebExpress.WebUI</div>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdownItemHeader()
            {
                Text = text,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
