using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the toolbar item divider control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlToolbarItemDivider
    {
        /// <summary>
        /// Tests the id property of the toolbar item divider control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-separator""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-toolbar-separator""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemDivider(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the alignment property of the toolbar item divider control.
        /// </summary>
        [Theory]
        [InlineData(TypeToolbarItemAlignment.Default, @"<div class=""wx-toolbar-separator""></div>")]
        [InlineData(TypeToolbarItemAlignment.Left, @"<div class=""wx-toolbar-separator"" data-align=""left""></div>")]
        [InlineData(TypeToolbarItemAlignment.Right, @"<div class=""wx-toolbar-separator"" data-align=""right""></div>")]
        public void Alignment(TypeToolbarItemAlignment alignment, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemDivider()
            {
                Alignment = alignment,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }
    }
}
