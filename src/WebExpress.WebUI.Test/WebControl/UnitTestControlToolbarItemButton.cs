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
    /// Tests the toolbar item button control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlToolbarItemButton
    {
        /// <summary>
        /// Tests the id property of the toolbar item button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-button""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-toolbar-button""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemButton(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the toolbar item button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-button""></div>")]
        [InlineData("abc", @"<div class=""wx-toolbar-button"" data-label=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-toolbar-button"" data-label=""WebExpress.WebUI""></div>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemButton()
            {
                Text = text,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the toolbar item button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-button""></div>")]
        [InlineData("abc", @"<div class=""wx-toolbar-button"" data-title=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-toolbar-button"" data-title=""WebExpress.WebUI""></div>")]
        public void Tooltip(string tooltip, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemButton()
            {
                Tooltip = tooltip,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the toolbar item button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-button""></div>")]
        [InlineData(typeof(IconStar), @"<div class=""wx-toolbar-button"" data-icon=""fas fa-star""></div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemButton()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the active property of the toolbar item button control.
        /// </summary>
        [Theory]
        [InlineData(TypeActive.None, @"<div class=""wx-toolbar-button""></div>")]
        [InlineData(TypeActive.Active, @"<div class=""wx-toolbar-button"" active></div>")]
        [InlineData(TypeActive.Disabled, @"<div class=""wx-toolbar-button"" disabled></div>")]
        public void Active(TypeActive active, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemButton()
            {
                Active = active
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the modal property of the toolbar item button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-button""></div>")]
        [InlineData("id", @"<div class=""wx-toolbar-button"" data-modal=""#id""></div>")]
        public void Modal(string modal, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemButton()
            {
                Modal = modal
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the uri property of the toolbar item button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-button""></div>")]
        [InlineData("/a", @"<div class=""wx-toolbar-button"" data-uri=""/a""></div>")]
        [InlineData("/a/b", @"<div class=""wx-toolbar-button"" data-uri=""/a/b""></div>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemButton()
            {
                Uri = uri != null ? new UriEndpoint(uri) : null,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the color property of the toolbar item button control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div class=""wx-toolbar-button""></div>")]
        [InlineData(TypeColorText.Primary, @"<div class=""wx-toolbar-button"" data-color-css=""text-primary""></div>")]
        [InlineData(TypeColorText.Secondary, @"<div class=""wx-toolbar-button"" data-color-css=""text-secondary""></div>")]
        [InlineData(TypeColorText.Warning, @"<div class=""wx-toolbar-button"" data-color-css=""text-warning""></div>")]
        [InlineData(TypeColorText.Danger, @"<div class=""wx-toolbar-button"" data-color-css=""text-danger""></div>")]
        [InlineData(TypeColorText.Dark, @"<div class=""wx-toolbar-button"" data-color-css=""text-dark""></div>")]
        [InlineData(TypeColorText.Light, @"<div class=""wx-toolbar-button"" data-color-css=""text-light""></div>")]
        [InlineData(TypeColorText.Muted, @"<div class=""wx-toolbar-button"" data-color-css=""text-muted""></div>")]
        public void Color(TypeColorText color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemButton()
            {
                Color = new PropertyColorText(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the target property of the toolbar item button control.
        /// </summary>
        [Theory]
        [InlineData(TypeTarget.None, @"<div class=""wx-toolbar-button""></div>")]
        [InlineData(TypeTarget.Blank, @"<div class=""wx-toolbar-button"" data-target=""_blank""></div>")]
        [InlineData(TypeTarget.Self, @"<div class=""wx-toolbar-button"" data-target=""_self""></div>")]
        [InlineData(TypeTarget.Parent, @"<div class=""wx-toolbar-button"" data-target=""_parent""></div>")]
        [InlineData(TypeTarget.Framename, @"<div class=""wx-toolbar-button"" data-target=""_framename""></div>")]
        public void Target(TypeTarget target, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemButton()
            {
                Target = target,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the alignment property of the toolbar item button control.
        /// </summary>
        [Theory]
        [InlineData(TypeToolbarItemAlignment.Default, @"<div class=""wx-toolbar-button""></div>")]
        [InlineData(TypeToolbarItemAlignment.Left, @"<div class=""wx-toolbar-button"" data-align=""left""></div>")]
        [InlineData(TypeToolbarItemAlignment.Right, @"<div class=""wx-toolbar-button"" data-align=""right""></div>")]
        public void Alignment(TypeToolbarItemAlignment alignment, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemButton()
            {
                Alignment = alignment,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }
    }
}
