using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the sidebar item panel control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSidebarItemControl
    {
        /// <summary>
        /// Tests the id property of the sidebar item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-control""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-sidebar-control""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemControl(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the sidebar item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-control""></div>")]
        [InlineData("abc", @"<div class=""wx-sidebar-control"" data-title=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-sidebar-control"" data-title=""WebExpress.WebUI""></div>")]
        public void Tooltip(string tooltip, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemControl()
            {
                Tooltip = tooltip,
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the sidebar item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-control""></div>")]
        [InlineData(typeof(IconStar), @"<div class=""wx-sidebar-control"" data-icon=""fas fa-star""></div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemControl()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the sidebar item control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div class=""wx-sidebar-control""></div>")]
        [InlineData(TypeColorText.Primary, @"<div class=""wx-sidebar-control"" data-color-css=""text-primary""></div>")]
        [InlineData(TypeColorText.Secondary, @"<div class=""wx-sidebar-control"" data-color-css=""text-secondary""></div>")]
        [InlineData(TypeColorText.Warning, @"<div class=""wx-sidebar-control"" data-color-css=""text-warning""></div>")]
        [InlineData(TypeColorText.Danger, @"<div class=""wx-sidebar-control"" data-color-css=""text-danger""></div>")]
        [InlineData(TypeColorText.Dark, @"<div class=""wx-sidebar-control"" data-color-css=""text-dark""></div>")]
        [InlineData(TypeColorText.Light, @"<div class=""wx-sidebar-control"" data-color-css=""text-light""></div>")]
        [InlineData(TypeColorText.Muted, @"<div class=""wx-sidebar-control"" data-color-css=""text-muted""></div>")]
        public void Color(TypeColorText color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemControl()
            {
                Color = new PropertyColorText(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the mode property of the sidebar item control.
        /// </summary>
        [Theory]
        [InlineData(TypeSidebarModeExtended.Default, @"<div class=""wx-sidebar-control""></div>")]
        [InlineData(TypeSidebarModeExtended.Hide, @"<div class=""wx-sidebar-control"" data-mode=""hide""></div>")]
        [InlineData(TypeSidebarModeExtended.Overlay, @"<div class=""wx-sidebar-control"" data-mode=""overlay""></div>")]
        public void Mode(TypeSidebarModeExtended mode, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemControl()
            {
                Mode = mode
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the content property of the sidebar item control.
        /// </summary>
        [Fact]
        public void Control()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemControl()
            {
                Content = new ControlText()
                {
                    Text = "Content"
                },
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders
            (
                @"<div class=""wx-sidebar-control""><div>Content</div></div>",
                html
            );
        }
    }
}
