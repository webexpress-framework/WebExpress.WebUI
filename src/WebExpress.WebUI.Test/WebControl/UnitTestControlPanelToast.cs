using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the toast control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPanelToast
    {
        /// <summary>
        /// Tests the id property of the toast control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""alert"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData("id", @"<div id=""id"" class=""alert"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelToast(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the toast control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackgroundAlert.Default, @"<div class=""alert"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypeColorBackgroundAlert.Primary, @"<div class=""alert bg-primary"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypeColorBackgroundAlert.Secondary, @"<div class=""alert bg-secondary"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypeColorBackgroundAlert.Info, @"<div class=""alert alert-info"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypeColorBackgroundAlert.Warning, @"<div class=""alert alert-warning"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypeColorBackgroundAlert.Danger, @"<div class=""alert alert-danger"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypeColorBackgroundAlert.Dark, @"<div class=""alert alert-dark"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypeColorBackgroundAlert.Light, @"<div class=""alert alert-light"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypeColorBackgroundAlert.Transparent, @"<div class=""alert bg-transparent"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        public void BackgroundColor(TypeColorBackgroundAlert backgroundColor, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelToast()
            {
                BackgroundColor = new PropertyColorBackgroundAlert(backgroundColor)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the direction property of the toast control.
        /// </summary>
        [Theory]
        [InlineData(TypeDirection.Default, @"<div class=""alert"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypeDirection.Vertical, @"<div class=""alert flex-column"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypeDirection.VerticalReverse, @"<div class=""alert flex-column-reverse"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypeDirection.Horizontal, @"<div class=""alert flex-row"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypeDirection.HorizontalReverse, @"<div class=""alert flex-row-reverse"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        public void Direction(TypeDirection direction, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelToast()
            {
                Direction = direction,
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the fluid property of the toast control.
        /// </summary>
        [Theory]
        [InlineData(TypePanelContainer.None, @"<div class=""alert"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypePanelContainer.Default, @"<div class=""alert container"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypePanelContainer.Fluid, @"<div class=""alert container-fluid"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        public void Fluid(TypePanelContainer fluid, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelToast()
            {
                Fluid = fluid,
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the theme property of the panel control.
        /// </summary>
        [Theory]
        [InlineData(TypeTheme.None, @"<div class=""alert"" role=""alert""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypeTheme.Light, @"<div class=""alert"" role=""alert"" data-bs-theme=""light""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(TypeTheme.Dark, @"<div class=""alert"" role=""alert"" data-bs-theme=""dark""><div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        public void Theme(TypeTheme theme, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelToast()
            {
                Theme = theme
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the toast control.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlText), @"<div class=""alert"" role=""alert""><div><div></div></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(typeof(ControlLink), @"<div class=""alert"" role=""alert""><div><a class=""wx-link""></a></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        [InlineData(typeof(ControlImage), @"<div class=""alert"" role=""alert""><div><img></div><button class=""btn"" data-bs-dismiss=""alert"" aria-label=""close""><i class=""fas fa-xmark""></i></button></div>")]
        public void Add(Type child, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var childInstance = Activator.CreateInstance(child, [null]) as IControl;
            var control = new ControlPanelToast();

            // test execution
            control.Add(childInstance);

            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
