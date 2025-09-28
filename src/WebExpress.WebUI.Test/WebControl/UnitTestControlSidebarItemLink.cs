using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the sidebar item link control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSidebarItemLink
    {
        /// <summary>
        /// Tests the id property of the sidebar item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-link""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-sidebar-link""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemLink(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the sidebar item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-link""></div>")]
        [InlineData("abc", @"<div class=""wx-sidebar-link"" data-label=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-sidebar-link"" data-label=""WebExpress.WebUI""></div>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemLink()
            {
                Text = text,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the sidebar item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-link""></div>")]
        [InlineData("abc", @"<div class=""wx-sidebar-link"" data-title=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-sidebar-link"" data-title=""WebExpress.WebUI""></div>")]
        public void Tooltip(string tooltip, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemLink()
            {
                Tooltip = tooltip,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the sidebar item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-link""></div>")]
        [InlineData(typeof(IconStar), @"<div class=""wx-sidebar-link"" data-icon=""fas fa-star""></div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemLink()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the active property of the sidebar item link control.
        /// </summary>
        [Theory]
        [InlineData(TypeActive.None, @"<div class=""wx-sidebar-link""></div>")]
        [InlineData(TypeActive.Active, @"<div class=""wx-sidebar-link"" active></div>")]
        [InlineData(TypeActive.Disabled, @"<div class=""wx-sidebar-link"" disabled></div>")]
        public void Active(TypeActive active, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemLink()
            {
                Active = active
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the modal property of the sidebar item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-link""></div>")]
        [InlineData("id", @"<div class=""wx-sidebar-link"" data-modal=""id""></div>")]
        public void Modal(string modal, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemLink()
            {
                Modal = modal
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the uri property of the sidebar item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-link""></div>")]
        [InlineData("/a", @"<div class=""wx-sidebar-link"" data-uri=""/a""></div>")]
        [InlineData("/a/b", @"<div class=""wx-sidebar-link"" data-uri=""/a/b""></div>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemLink()
            {
                Uri = uri != null ? new UriEndpoint(uri) : null,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the color property of the sidebar item link control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div class=""wx-sidebar-link""></div>")]
        [InlineData(TypeColorText.Primary, @"<div class=""wx-sidebar-link"" data-color-css=""text-primary""></div>")]
        [InlineData(TypeColorText.Secondary, @"<div class=""wx-sidebar-link"" data-color-css=""text-secondary""></div>")]
        [InlineData(TypeColorText.Warning, @"<div class=""wx-sidebar-link"" data-color-css=""text-warning""></div>")]
        [InlineData(TypeColorText.Danger, @"<div class=""wx-sidebar-link"" data-color-css=""text-danger""></div>")]
        [InlineData(TypeColorText.Dark, @"<div class=""wx-sidebar-link"" data-color-css=""text-dark""></div>")]
        [InlineData(TypeColorText.Light, @"<div class=""wx-sidebar-link"" data-color-css=""text-light""></div>")]
        [InlineData(TypeColorText.Muted, @"<div class=""wx-sidebar-link"" data-color-css=""text-muted""></div>")]
        public void Color(TypeColorText color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemLink()
            {
                Color = new PropertyColorText(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the target property of the sidebar item link control.
        /// </summary>
        [Theory]
        [InlineData(TypeTarget.None, @"<div class=""wx-sidebar-link""></div>")]
        [InlineData(TypeTarget.Blank, @"<div class=""wx-sidebar-link"" data-target=""_blank""></div>")]
        [InlineData(TypeTarget.Self, @"<div class=""wx-sidebar-link"" data-target=""_self""></div>")]
        [InlineData(TypeTarget.Parent, @"<div class=""wx-sidebar-link"" data-target=""_parent""></div>")]
        [InlineData(TypeTarget.Framename, @"<div class=""wx-sidebar-link"" data-target=""_framename""></div>")]
        public void Target(TypeTarget target, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemLink()
            {
                Target = target,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the mode property of the sidebar item divider control.
        /// </summary>
        [Theory]
        [InlineData(TypeSidebarMode.Default, @"<div class=""wx-sidebar-link""></div>")]
        [InlineData(TypeSidebarMode.Hide, @"<div class=""wx-sidebar-link"" data-mode=""hide""></div>")]
        public void Mode(TypeSidebarMode mode, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemLink()
            {
                Mode = mode
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the dismissibility property of the sidebar item divider control.
        /// </summary>
        [Theory]
        [InlineData(TypeDismissibilitySidebar.None, @"<div class=""wx-sidebar-link""></div>")]
        [InlineData(TypeDismissibilitySidebar.Dismissible, @"<div class=""wx-sidebar-link"" data-dismissibility=""true""></div>")]
        public void Dismissibility(TypeDismissibilitySidebar dismissibility, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemLink()
            {
                Dismissibility = dismissibility
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
