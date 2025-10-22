using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the sidebar item label control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSidebarItemHeader
    {
        /// <summary>
        /// Tests the id property of the sidebar item header control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-header""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-sidebar-header""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemHeader(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the sidebar item header control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-header""></div>")]
        [InlineData("abc", @"<div class=""wx-sidebar-header"" data-label=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-sidebar-header"" data-label=""WebExpress.WebUI""></div>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemHeader()
            {
                Text = text,
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the sidebar item header control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-header""></div>")]
        [InlineData("abc", @"<div class=""wx-sidebar-header"" data-title=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-sidebar-header"" data-title=""WebExpress.WebUI""></div>")]
        public void Tooltip(string tooltip, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemHeader()
            {
                Tooltip = tooltip,
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the sidebar item header control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div class=""wx-sidebar-header""></div>")]
        [InlineData(TypeColorText.Primary, @"<div class=""wx-sidebar-header"" data-color-css=""text-primary""></div>")]
        [InlineData(TypeColorText.Secondary, @"<div class=""wx-sidebar-header"" data-color-css=""text-secondary""></div>")]
        [InlineData(TypeColorText.Warning, @"<div class=""wx-sidebar-header"" data-color-css=""text-warning""></div>")]
        [InlineData(TypeColorText.Danger, @"<div class=""wx-sidebar-header"" data-color-css=""text-danger""></div>")]
        [InlineData(TypeColorText.Dark, @"<div class=""wx-sidebar-header"" data-color-css=""text-dark""></div>")]
        [InlineData(TypeColorText.Light, @"<div class=""wx-sidebar-header"" data-color-css=""text-light""></div>")]
        [InlineData(TypeColorText.Muted, @"<div class=""wx-sidebar-header"" data-color-css=""text-muted""></div>")]
        public void Color(TypeColorText color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemHeader()
            {
                Color = new PropertyColorText(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the disabled property of the sidebar item header control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-sidebar-header""></div>")]
        [InlineData(true, @"<div class=""wx-sidebar-header"" disabled></div>")]
        public void Disable(bool disabled, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemHeader()
            {
                Disabled = disabled,
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }
    }
}
