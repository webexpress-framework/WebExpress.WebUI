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
        [InlineData(null, @"<div class=""alert"" role=""alert""></div>")]
        [InlineData("id", @"<div id=""id"" class=""alert"" role=""alert""></div>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<div id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C"" class=""alert"" role=""alert""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAlert(id)
            {
                Dismissibility = TypeDismissibilityAlert.None
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the alert control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""alert"" role=""alert""></div>")]
        [InlineData("", @"<div class=""alert"" role=""alert""></div>")]
        [InlineData("abc", @"<div class=""alert"" role=""alert"">abc</div>")]
        public void Text(string text, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAlert()
            {
                Dismissibility = TypeDismissibilityAlert.None,
                Text = text
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the backgroundcolor property of the alert control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackgroundAlert.Default, @"<div class=""alert"" role=""alert""></div>")]
        [InlineData(TypeColorBackgroundAlert.Primary, @"<div class=""alert bg-primary"" role=""alert""></div>")]
        [InlineData(TypeColorBackgroundAlert.Secondary, @"<div class=""alert bg-secondary"" role=""alert""></div>")]
        [InlineData(TypeColorBackgroundAlert.Info, @"<div class=""alert alert-info"" role=""alert""></div>")]
        [InlineData(TypeColorBackgroundAlert.Warning, @"<div class=""alert alert-warning"" role=""alert""></div>")]
        [InlineData(TypeColorBackgroundAlert.Danger, @"<div class=""alert alert-danger"" role=""alert""></div>")]
        [InlineData(TypeColorBackgroundAlert.Dark, @"<div class=""alert alert-dark"" role=""alert""></div>")]
        [InlineData(TypeColorBackgroundAlert.White, @"<div class=""alert bg-white"" role=""alert""></div>")]
        [InlineData(TypeColorBackgroundAlert.Transparent, @"<div class=""alert bg-transparent"" role=""alert""></div>")]
        [InlineData(TypeColorBackgroundAlert.Highlight, @"<div class=""alert alert-highlight"" role=""alert""></div>")]
        public void BackgroundColor(TypeColorBackgroundAlert color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAlert()
            {
                Dismissibility = TypeDismissibilityAlert.None,
                BackgroundColor = new PropertyColorBackgroundAlert(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the dismissibility property of the alert control.
        /// </summary>
        [Theory]
        [InlineData(TypeDismissibilityAlert.None, @"<div class=""alert"" role=""alert""></div>")]
        [InlineData(TypeDismissibilityAlert.Dismissible, @"<div class=""alert alert-dismissible"" role=""alert""><button class=""btn wx-button-close"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-times""></i></button></div>")]
        public void Dismissibility(TypeDismissibilityAlert dismissibility, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAlert()
            {
                Dismissibility = dismissibility
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
