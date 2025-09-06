using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the alert control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlAlert
    {
        /// <summary>
        /// Tests the id property of the alert control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""alert"" role=""alert""><button class=""btn-close"" data-bs-dismiss=""alert"" aria-label=""close""></button></div>")]
        [InlineData("id", @"<div id=""id"" class=""alert"" role=""alert""><button class=""btn-close"" data-bs-dismiss=""alert"" aria-label=""close""></button></div>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<div id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C"" class=""alert"" role=""alert""><button class=""btn-close"" data-bs-dismiss=""alert"" aria-label=""close""></button></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAlert(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            Assert.Equal(expected, html.Trim());
        }

        /// <summary>
        /// Tests the text property of the alert control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""alert"" role=""alert""><button class=""btn-close"" data-bs-dismiss=""alert"" aria-label=""close""></button></div>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAlert()
            {
                Text = text
            };

            // test execution
            var html = control.Render(context, visualTree);

            Assert.Equal(expected, html.Trim());
        }

        /// <summary>
        /// Tests the backgroundcolor property of the alert control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackgroundAlert.Default, @"<div class=""alert"" role=""alert""><button class=""btn-close"" data-bs-dismiss=""alert"" aria-label=""close""></button></div>")]
        [InlineData(TypeColorBackgroundAlert.Primary, @"<div class=""alert bg-primary"" role=""alert""><button class=""btn-close"" data-bs-dismiss=""alert"" aria-label=""close""></button></div>")]
        [InlineData(TypeColorBackgroundAlert.Secondary, @"<div class=""alert bg-secondary"" role=""alert""><button class=""btn-close"" data-bs-dismiss=""alert"" aria-label=""close""></button></div>")]
        [InlineData(TypeColorBackgroundAlert.Info, @"<div class=""alert alert-info"" role=""alert""><button class=""btn-close"" data-bs-dismiss=""alert"" aria-label=""close""></button></div>")]
        [InlineData(TypeColorBackgroundAlert.Warning, @"<div class=""alert alert-warning"" role=""alert""><button class=""btn-close"" data-bs-dismiss=""alert"" aria-label=""close""></button></div>")]
        [InlineData(TypeColorBackgroundAlert.Danger, @"<div class=""alert alert-danger"" role=""alert""><button class=""btn-close"" data-bs-dismiss=""alert"" aria-label=""close""></button></div>")]
        [InlineData(TypeColorBackgroundAlert.Dark, @"<div class=""alert alert-dark"" role=""alert""><button class=""btn-close"" data-bs-dismiss=""alert"" aria-label=""close""></button></div>")]
        [InlineData(TypeColorBackgroundAlert.White, @"<div class=""alert bg-white"" role=""alert""><button class=""btn-close"" data-bs-dismiss=""alert"" aria-label=""close""></button></div>")]
        [InlineData(TypeColorBackgroundAlert.Transparent, @"<div class=""alert bg-transparent"" role=""alert""><button class=""btn-close"" data-bs-dismiss=""alert"" aria-label=""close""></button></div>")]
        public void BackgroundColor(TypeColorBackgroundAlert color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAlert()
            {
                BackgroundColor = new PropertyColorBackgroundAlert(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
