using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the sidebar item icon control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSidebarItemIcon
    {
        /// <summary>
        /// Tests the id property of the sidebar item icon control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-icon""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-sidebar-icon""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemIcon(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the sidebar item icon control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-icon""></div>")]
        [InlineData("fas fa-cog", @"<div class=""wx-sidebar-icon"" data-icon=""fas fa-cog""></div>")]
        public void IconClass(string iconClass, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemIcon()
            {
                Icon = iconClass is not null ? new IconCog() : null
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the sidebar item icon control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-icon""></div>")]
        [InlineData("/img/test.png", @"<div class=""wx-sidebar-icon"" data-image=""/img/test.png""></div>")]
        public void IconImage(string iconImage, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemIcon()
            {
                Icon = !string.IsNullOrWhiteSpace(iconImage)
                    ? new ImageIcon(new UriEndpoint(iconImage))
                    : null
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the sidebar item icon control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-icon""></div>")]
        [InlineData("Text", @"<div class=""wx-sidebar-icon"" data-icon-text=""Text""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-sidebar-icon"" data-icon-text=""WebExpress.WebUI""></div>")]
        public void IconText(string text, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemIcon()
            {
                Text = text
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the edit property of the sidebar item icon control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-sidebar-icon""></div>")]
        [InlineData(true, @"<div class=""wx-sidebar-icon"" data-icon-edit=""true""></div>")]
        public void IconEdit(bool iconEdit, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemIcon()
            {
                IconEdit = iconEdit
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the sidebar item icon control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-icon""></div>")]
        [InlineData("/a", @"<div class=""wx-sidebar-icon"" data-uri=""/a""></div>")]
        [InlineData("/a/b", @"<div class=""wx-sidebar-icon"" data-uri=""/a/b""></div>")]
        public void Uri(string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemIcon()
            {
                Uri = uri is not null ? new UriEndpoint(uri) : null,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the modal and uri property of the sidebar item icon control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-icon"" data-wx-toggle=""modal"" data-wx-target=""#modalId""></div>")]
        [InlineData("/a/b", @"<div class=""wx-sidebar-icon"" data-wx-toggle=""modal"" data-wx-target=""#modalId"" data-wx-uri=""/a/b""></div>")]
        public void ModalUri(string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemIcon()
            {
                Modal = new ModalTarget("modalId"),
                Uri = uri is not null ? new UriEndpoint(uri) : null,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the edit property of the sidebar item icon control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-sidebar-icon""></div>")]
        [InlineData("modalId", @"<div class=""wx-sidebar-icon"" data-wx-toggle=""modal"" data-wx-target=""#modalId""></div>")]
        public void Modal(string iconEditModal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemIcon()
            {
                Modal = new ModalTarget(iconEditModal)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the mode property of the sidebar item icon control.
        /// </summary>
        [Theory]
        [InlineData(TypeSidebarMode.Default, @"<div class=""wx-sidebar-icon""></div>")]
        [InlineData(TypeSidebarMode.Hide, @"<div class=""wx-sidebar-icon"" data-mode=""hide""></div>")]
        public void Mode(TypeSidebarMode mode, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebarItemIcon()
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