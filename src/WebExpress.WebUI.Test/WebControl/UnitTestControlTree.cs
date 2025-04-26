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
    /// Tests the tree control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTree : IClassFixture<UnitTestControlFixture>
    {
        /// <summary>
        /// Tests the id property of the tree control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-tree""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-tree""></div>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<div id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C"" class=""wx-webui-tree""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the expand property of the tree control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-tree""><div class=""wx-tree-node""></div></div>")]
        [InlineData(true, @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-expand=""true""></div></div>")]
        public void Expand(bool expand, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree(null, new ControlTreeItem() { Expand = expand })
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }


        /// <summary>
        /// Tests the icon property of the tree control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-tree""><div class=""wx-tree-node""></div></div>")]
        [InlineData(typeof(IconFolder), @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-icon=""fas fa-folder""></div></div>")]
        public void Icon(Type iconType, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var icon = iconType != null ? Activator.CreateInstance(iconType) as IIcon : null;
            var control = new ControlTree(null, new ControlTreeItem() { Icon = icon })
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon open and close property of the tree control.
        /// </summary>
        [Theory]
        [InlineData(null, null, @"<div class=""wx-webui-tree""><div class=""wx-tree-node""></div></div>")]
        [InlineData(typeof(IconFolderOpen), typeof(IconFolder), @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-icon-opened=""fas fa-folder-open"" data-icon-closed=""fas fa-folder-open""></div></div>")]
        public void IconOpenClose(Type iconOpenType, Type iconCloseType, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var iconOpen = iconOpenType != null ? Activator.CreateInstance(iconOpenType) as IIcon : null;
            var iconClose = iconCloseType != null ? Activator.CreateInstance(iconOpenType) as IIcon : null;
            var control = new ControlTree(null, new ControlTreeItem() { IconOpen = iconOpen, IconClose = iconClose })
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the tree control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-tree""><div class=""wx-tree-node""></div></div>")]
        [InlineData("/home", @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-url=""/home""></div></div>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree(null, new ControlTreeItemLink() { Uri = uri != null ? new UriEndpoint(uri) : null })
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the tree control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-tree""><div class=""wx-tree-node""></div></div>")]
        [InlineData("abc", @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-tooltip=""abc""></div></div>")]
        public void Tooltip(string tooltip, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree(null, new ControlTreeItemLink() { Tooltip = tooltip })
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the target property of the tree control.
        /// </summary>
        [Theory]
        [InlineData(TypeTarget.None, @"<div class=""wx-webui-tree""><div class=""wx-tree-node""></div></div>")]
        [InlineData(TypeTarget.Blank, @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-target=""blank""></div></div>")]
        [InlineData(TypeTarget.Self, @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-target=""self""></div></div>")]
        [InlineData(TypeTarget.Parent, @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-target=""parent""></div></div>")]
        [InlineData(TypeTarget.Framename, @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-target=""framename""></div></div>")]
        public void Target(TypeTarget target, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree(null, new ControlTreeItemLink() { Target = target })
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the disable indicator property of the tree control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-tree""></div>")]
        [InlineData(true, @"<div class=""wx-webui-tree"" data-indicator=""false""></div>")]
        public void DisableIndicator(bool disableIndicator, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree()
            {
                DisableIndicator = disableIndicator
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the movable property of the tree control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-tree""></div>")]
        [InlineData(true, @"<div class=""wx-webui-tree"" data-movable=""true""></div>")]
        public void Movable(bool movable, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree()
            {
                Movable = movable
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the layout property of the tree control.
        /// </summary>
        [Theory]
        [InlineData(TypeLayoutTree.Default, @"<div class=""wx-webui-tree""></div>")]
        [InlineData(TypeLayoutTree.Group, @"<div class=""wx-webui-tree"" data-layout=""wx-tree-group""></div>")]
        [InlineData(TypeLayoutTree.Horizontal, @"<div class=""wx-webui-tree"" data-layout=""wx-tree-horizontal""></div>")]
        [InlineData(TypeLayoutTree.Flat, @"<div class=""wx-webui-tree"" data-layout=""wx-tree-flat""></div>")]
        [InlineData(TypeLayoutTree.Flush, @"<div class=""wx-webui-tree"" data-layout=""wx-tree-flush""></div>")]
        public void Layout(TypeLayoutTree layout, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree()
            {
                Layout = layout
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the tree control.
        /// </summary>
        [Theory]
        [MemberData(nameof(GetControlTreeItemsData))]
        public void Add(IEnumerable<ControlTreeItem> items, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            // test execution
            var control = new ControlTree(null, items.ToArray());
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Provides test data for the Add method of the UnitTestControlList class.
        /// </summary>
        /// <returns>An enumerable collection of object arrays, each containing test data.</returns>
        public static TheoryData<IEnumerable<ControlTreeItem>, string> GetControlTreeItemsData()
        {
            return new TheoryData<IEnumerable<ControlTreeItem>, string>
            {
                {
                    [
                        new ControlTreeItem("1",
                        [
                            new ControlTreeItemLink("1.1")
                            {
                                Label = "Node 1.1", Uri = new UriEndpoint("/home")
                            },
                            new ControlTreeItem("1.2")
                            {
                                Label = "Node 1.2"
                            }
                        ])
                        {
                            Label = "Node 1",
                            Icon = new IconHome(),
                            Expand = true
                        },
                        new ControlTreeItem("2",
                        [
                            new ControlTreeItemLink("2.1")
                            {
                                Label = "Node 2.1",
                                Uri = new UriEndpoint("/info"),
                                Target = WebCore.WebHtml.TypeTarget.Blank,
                                Tooltip = "Tooltip"
                            },
                            new ControlTreeItem("2.2")
                            {
                                Label = "Node 2.2"
                            }
                        ])
                        {
                            Label = "Node 2",
                            Icon = new IconCog()
                        }
                    ],
                    @"<div class=""wx-webui-tree""><div id=""1"" class=""wx-tree-node"" data-label=""Node 1"" data-expand=""true"" data-icon=""fas fa-home""><div id=""1.1"" class=""wx-tree-node"" data-label=""Node 1.1"" data-url=""/home""></div><div id=""1.2"" class=""wx-tree-node"" data-label=""Node 1.2""></div></div><div id=""2"" class=""wx-tree-node"" data-label=""Node 2"" data-icon=""fas fa-cog""><div id=""2.1"" class=""wx-tree-node"" data-label=""Node 2.1"" data-url=""/info"" data-target=""blank"" data-tooltip=""Tooltip""></div><div id=""2.2"" class=""wx-tree-node"" data-label=""Node 2.2""></div></div></div>"
                }
            };
        }
    }
}
