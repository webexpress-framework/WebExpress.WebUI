using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the sidebar item divider control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSidebarItemDivider
    {
        /// <summary>
        /// Tests the id property of the sidebar item divider control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-separator""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-sidebar-separator""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemDivider(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the mode property of the sidebar item divider control.
        /// </summary>
        [Theory]
        [InlineData(TypeSidebarMode.Default, @"<div class=""wx-sidebar-separator""></div>")]
        [InlineData(TypeSidebarMode.Hide, @"<div class=""wx-sidebar-separator"" data-mode=""hide""></div>")]
        public void Mode(TypeSidebarMode mode, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemDivider()
            {
                Mode = mode
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
