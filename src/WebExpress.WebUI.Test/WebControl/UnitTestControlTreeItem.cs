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
    /// Tests the tree item control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTreeItem : IClassFixture<UnitTestControlFixture>
    {
        /// <summary>
        /// Tests the id property of the tree item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tree-node""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-tree-node""></div>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<div id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C"" class=""wx-tree-node""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTreeItem(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the expand property of the tree item control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-tree-node""></div>")]
        [InlineData(true, @"<div class=""wx-tree-node"" data-expand=""true""></div>")]
        public void Expand(bool expand, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTreeItem()
            {
                Expand = expand
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the tree item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tree-node""></div>")]
        [InlineData("abc", @"<div class=""wx-tree-node"" data-label=""abc""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-tree-node"" data-label=""WebExpress.WebUI""></div>")]
        public void Text(string label, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTreeItem()
            {
                Text = label
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the tree item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tree-node""></div>")]
        [InlineData(typeof(IconFolder), @"<div class=""wx-tree-node"" data-icon=""fas fa-folder""></div>")]
        public void Icon(Type iconType, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var icon = iconType is not null ? Activator.CreateInstance(iconType) as IIcon : null;
            var control = new ControlTreeItem()
            {
                Icon = icon
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon open and close property of the tree item control.
        /// </summary>
        [Theory]
        [InlineData(null, null, @"<div class=""wx-tree-node""></div>")]
        [InlineData(typeof(IconFolderOpen), typeof(IconFolder), @"<div class=""wx-tree-node"" data-icon-opened=""fas fa-folder-open"" data-icon-closed=""fas fa-folder-open""></div>")]
        public void IconOpenClose(Type iconOpenType, Type iconCloseType, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var iconOpen = iconOpenType is not null ? Activator.CreateInstance(iconOpenType) as IIcon : null;
            var iconClose = iconCloseType is not null ? Activator.CreateInstance(iconOpenType) as IIcon : null;
            var control = new ControlTreeItem()
            {
                IconOpen = iconOpen,
                IconClose = iconClose
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the tree item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tree-node""></div>")]
        [InlineData("/home", @"<div class=""wx-tree-node"" data-uri=""/home""></div>")]
        public void Uri(string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTreeItem()
            {
                Uri = uri is not null ? new UriEndpoint(uri) : null
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the tree item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tree-node""></div>")]
        [InlineData("abc", @"<div class=""wx-tree-node"" data-tooltip=""abc""></div>")]
        public void Tooltip(string tooltip, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTreeItem()
            {
                Tooltip = tooltip
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the target property of the tree item control.
        /// </summary>
        [Theory]
        [InlineData(TypeTarget.None, @"<div class=""wx-tree-node""></div>")]
        [InlineData(TypeTarget.Blank, @"<div class=""wx-tree-node"" data-target=""_blank""></div>")]
        [InlineData(TypeTarget.Self, @"<div class=""wx-tree-node"" data-target=""_self""></div>")]
        [InlineData(TypeTarget.Parent, @"<div class=""wx-tree-node"" data-target=""_parent""></div>")]
        [InlineData(TypeTarget.Framename, @"<div class=""wx-tree-node"" data-target=""_framename""></div>")]
        public void Target(TypeTarget target, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTreeItem()
            {
                Target = target
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the active property of the tree item control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-tree-node""></div>")]
        [InlineData(true, @"<div class=""wx-tree-node"" data-active=""true""></div>")]
        public void Active(bool active, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTreeItem()
            {
                Active = active
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the primary action property of the tree item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tree-node""></div>")]
        [InlineData("modal", @"<div class=""wx-tree-node"" data-wx-primary-action=""modal"" data-wx-primary-target=""#modal""></div>")]
        public void PrimaryAction(string modal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTreeItem()
            {
                PrimaryAction = new ActionModal(modal)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the secondary action property of the tree item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tree-node""></div>")]
        [InlineData("modal", @"<div class=""wx-tree-node"" data-wx-secondary-action=""modal"" data-wx-secondary-target=""#modal""></div>")]
        public void SecondaryAction(string modal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTreeItem()
            {
                SecondaryAction = new ActionModal(modal)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
