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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the expand property of the tree control item.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-tree""><div class=""wx-tree-node""></div></div>")]
        [InlineData(true, @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-expand=""true""></div></div>")]
        public void Expand(bool expand, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree(null, new ControlTreeItem() { Expand = expand })
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the tree control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-tree""><div class=""wx-tree-node""></div></div>")]
        [InlineData("abc", @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-label=""abc""></div></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-label=""WebExpress.WebUI""></div></div>")]
        public void Text(string label, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree(null, new ControlTreeItem() { Text = label })
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the tree control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-tree""><div class=""wx-tree-node""></div></div>")]
        [InlineData(typeof(IconFolder), @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-icon=""fas fa-folder""></div></div>")]
        public void Icon(Type iconType, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var icon = iconType is not null ? Activator.CreateInstance(iconType) as IIcon : null;
            var control = new ControlTree(null, new ControlTreeItem() { Icon = icon })
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon open and close property of the tree control item.
        /// </summary>
        [Theory]
        [InlineData(null, null, @"<div class=""wx-webui-tree""><div class=""wx-tree-node""></div></div>")]
        [InlineData(typeof(IconFolderOpen), typeof(IconFolder), @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-icon-opened=""fas fa-folder-open"" data-icon-closed=""fas fa-folder-open""></div></div>")]
        public void IconOpenClose(Type iconOpenType, Type iconCloseType, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var iconOpen = iconOpenType is not null ? Activator.CreateInstance(iconOpenType) as IIcon : null;
            var iconClose = iconCloseType is not null ? Activator.CreateInstance(iconOpenType) as IIcon : null;
            var control = new ControlTree(null, new ControlTreeItem() { IconOpen = iconOpen, IconClose = iconClose })
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the tree control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-tree""><div class=""wx-tree-node""></div></div>")]
        [InlineData("/home", @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-uri=""/home""></div></div>")]
        public void Uri(string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree(null, new ControlTreeItem() { Uri = uri is not null ? new UriEndpoint(uri) : null })
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the tree control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-tree""><div class=""wx-tree-node""></div></div>")]
        [InlineData("abc", @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-tooltip=""abc""></div></div>")]
        public void Tooltip(string tooltip, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree(null, new ControlTreeItem() { Tooltip = tooltip })
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the target property of the tree control item.
        /// </summary>
        [Theory]
        [InlineData(TypeTarget.None, @"<div class=""wx-webui-tree""><div class=""wx-tree-node""></div></div>")]
        [InlineData(TypeTarget.Blank, @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-target=""_blank""></div></div>")]
        [InlineData(TypeTarget.Self, @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-target=""_self""></div></div>")]
        [InlineData(TypeTarget.Parent, @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-target=""_parent""></div></div>")]
        [InlineData(TypeTarget.Framename, @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-target=""_framename""></div></div>")]
        public void Target(TypeTarget target, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree(null, new ControlTreeItem() { Target = target })
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the active property of the tree control item.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-tree""><div class=""wx-tree-node""></div></div>")]
        [InlineData(true, @"<div class=""wx-webui-tree""><div class=""wx-tree-node"" data-active=""true""></div></div>")]
        public void Active(bool active, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree(null, new ControlTreeItem() { Active = active })
            {
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree()
            {
                DisableIndicator = disableIndicator
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree()
            {
                Movable = movable
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTree()
            {
                Layout = layout
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            // act
            var control = new ControlTree()
                .Add(items);
            var html = control.Render(context, visualTree);

            // validation
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
                            new ControlTreeItem("1.1")
                            {
                                Text = "Node 1.1", Uri = new UriEndpoint("/home")
                            },
                            new ControlTreeItem("1.2")
                            {
                                Text = "Node 1.2"
                            }
                        ])
                        {
                            Text = "Node 1",
                            Icon = new IconHome(),
                            Expand = true
                        },
                        new ControlTreeItem("2",
                        [
                            new ControlTreeItem("2.1")
                            {
                                Text = "Node 2.1",
                                Uri = new UriEndpoint("/info"),
                                Target = TypeTarget.Blank,
                                Tooltip = "Tooltip"
                            },
                            new ControlTreeItem("2.2")
                            {
                                Text = "Node 2.2"
                            }
                        ])
                        {
                            Text = "Node 2",
                            Icon = new IconCog()
                        }
                    ],
                    @"<div class=""wx-webui-tree""><div id=""1"" class=""wx-tree-node"" data-label=""Node 1"" data-expand=""true"" data-icon=""fas fa-home""><div id=""1.1"" class=""wx-tree-node"" data-label=""Node 1.1"" data-uri=""/home""></div><div id=""1.2"" class=""wx-tree-node"" data-label=""Node 1.2""></div></div><div id=""2"" class=""wx-tree-node"" data-label=""Node 2"" data-icon=""fas fa-cog""><div id=""2.1"" class=""wx-tree-node"" data-label=""Node 2.1"" data-tooltip=""Tooltip"" data-uri=""/info"" data-target=""_blank""></div><div id=""2.2"" class=""wx-tree-node"" data-label=""Node 2.2""></div></div></div>"
                }
            };
        }
    }
}
