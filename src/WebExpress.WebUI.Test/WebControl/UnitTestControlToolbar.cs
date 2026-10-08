
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the toolbar control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlToolbar
    {
        /// <summary>
        /// Tests the id property of the toolbar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-toolbar px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-toolbar px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""></div>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<div id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C"" class=""wx-webui-toolbar px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbar(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the toolbar control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<div class=""wx-webui-toolbar px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""></div>")]
        [InlineData(TypeColorBackground.Primary, @"<div class=""wx-webui-toolbar bg-primary px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""></div>")]
        [InlineData(TypeColorBackground.Info, @"<div class=""wx-webui-toolbar bg-info px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""></div>")]
        [InlineData(TypeColorBackground.Success, @"<div class=""wx-webui-toolbar bg-success px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""></div>")]
        [InlineData(TypeColorBackground.Secondary, @"<div class=""wx-webui-toolbar bg-secondary px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""></div>")]
        [InlineData(TypeColorBackground.Warning, @"<div class=""wx-webui-toolbar bg-warning px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""></div>")]
        [InlineData(TypeColorBackground.Danger, @"<div class=""wx-webui-toolbar bg-danger px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""></div>")]
        [InlineData(TypeColorBackground.Dark, @"<div class=""wx-webui-toolbar bg-dark px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""></div>")]
        [InlineData(TypeColorBackground.Light, @"<div class=""wx-webui-toolbar bg-light px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""></div>")]
        [InlineData(TypeColorBackground.Highlight, @"<div class=""wx-webui-toolbar bg-highlight px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""></div>")]
        [InlineData(TypeColorBackground.White, @"<div class=""wx-webui-toolbar bg-white px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""></div>")]
        [InlineData(TypeColorBackground.Transparent, @"<div class=""wx-webui-toolbar bg-transparent px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""></div>")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbar()
            {
                BackgroundColor = _ => new PropertyColorBackground(backgroundColor)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the toolbar control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbar(null, new ControlToolbarItemButton() { Text = _ => "abc" });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-toolbar px-2 navbar-expand-sm"" role=""toolbar"" aria-label=""Toolbar""><div class=""wx-toolbar-button"" data-label=""abc""></div></div>", html);
        }
    }
}
