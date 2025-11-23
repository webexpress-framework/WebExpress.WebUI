using WebExpress.WebCore.WebScope;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebFragment
{
    /// <summary>
    /// Test the fragment manager.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestFragmentManager
    {
        /// <summary>
        /// Test the id property of the fragment manager.
        /// </summary>
        [Theory]
        [InlineData(typeof(TestApplication), typeof(TestFragmentControlText), "webexpress.webui.test.testfragmentcontroltext")]
        [InlineData(typeof(TestApplication), typeof(TestFragmentControlList), "webexpress.webui.test.testfragmentcontrollist")]
        [InlineData(typeof(TestApplication), typeof(TestFragmentControlLink), "webexpress.webui.test.testfragmentcontrollink")]
        public void Id(Type applicationType, Type fragmentType, string id)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(applicationType).FirstOrDefault();

            // test execution
            var fragment = componentHub.FragmentManager.GetFragments(application, fragmentType);

            if (id is null)
            {
                Assert.Empty(fragment);
                return;
            }

            Assert.Contains(id, fragment.Select(x => x.FragmentId?.ToString()));
        }

        /// <summary>
        /// Test the render function of the fragment manager.
        /// </summary>
        [Theory]
        [InlineData(typeof(TestApplication), typeof(IScope),
            @"<p id=""webexpress-webui-test-testfragmentcontroltext"">TestFragmentControlText</p>")]
        public void Render_TestSectionFragmentControlText(Type applicationType, Type scopeType, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(applicationType).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [scopeType]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // test execution
            var html = componentHub.FragmentManager.Render
            (
                renderContext,
                visualTree,
                typeof(TestSectionFragmentControlText)
            );

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for TestSectionFragmentControlList.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlList()
        {
            var expected = @"<ul id=""webexpress-webui-test-testfragmentcontrollist""><li></li></ul>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlList));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for TestSectionFragmentControlLink.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlLink()
        {
            var expected = @"<a id=""webexpress-webui-test-testfragmentcontrollink"" class=""wx-link"">TestFragmentControlLink</a>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlLink));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for TestSectionFragmentControlButtonLink.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlButtonLink()
        {
            var expected = @"<a id=""webexpress-webui-test-testfragmentcontrolbuttonlink"" class=""btn"">TestFragmentControlButtonLink</a>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlButtonLink));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for TestSectionFragmentControlImage.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlImage()
        {
            var expected = @"<img id=""webexpress-webui-test-testfragmentcontrolimage"" src=""/a/b/c"">";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlImage));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for Dropdown.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlDropdown()
        {
            var expected = @"<div id=""webexpress-webui-test-testfragmentcontroldropdown"" class=""wx-webui-dropdown"" role=""button"" data-label=""TestFragmentControlDropdown""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlDropdown));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for DropdownItemLink.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlDropdownItemLink()
        {
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontroldropdownitemlink"" class=""wx-dropdown-item"">TestFragmentControlDropdownItemLink</div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlDropdownItemLink));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for NavigationItemDropdown.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlNavigationItemDropdown()
        {
            var expected = @"<a id=""webexpress-webui-test-testfragmentcontrolnavigationitemdropdown"" class=""wx-link"">TestFragmentControlNavigationItemDropdown</a>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlNavigationItemDropdown));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for NavigationItemLink.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlNavigationItemLink()
        {
            var expected = @"<a id=""webexpress-webui-test-testfragmentcontrolnavigationitemlink"" class=""wx-link"">TestFragmentControlNavigationItemLink</a>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlNavigationItemLink));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for Navigation.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlNavigation()
        {
            var expected = @"<a id=""webexpress-webui-test-testfragmentcontrolnavigation"" class=""wx-link"">TestFragmentControlNavigation</a>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlNavigation));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for Panel.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlPanel()
        {
            var expected = @"<div id=""webexpress-webui-test-testfragmentcontrolpanel""><div>TestFragmentControlPanel</div></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlPanel));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for PanelFlex.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlPanelFlex()
        {
            var expected = @"<div id=""webexpress-webui-test-testfragmentcontrolpanelflex""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlPanelFlex));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for PanelTool.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlPanelTool()
        {
            var expected = @"<div id=""webexpress-webui-test-testfragmentcontrolpaneltool"" class=""toolpanel border""><div class=""wx-webui-dropdown"" role=""button""></div><div><div>TestFragmentControlPanelTool</div></div></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlPanelTool));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for SplitButtonItemLink.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlSplitButtonItemLink()
        {
            var expected = @"<a id=""webexpress-webui-test-testfragmentcontrolsplitbuttonitemlink"" class=""wx-link"">TestFragmentControlSplitButtonItemLink</a>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlSplitButtonItemLink));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for Tree.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlTree()
        {
            var expected = @"<ul id=""webexpress-webui-test-testfragmentcontroltree""><li></li></ul>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlTree));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for Form.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlForm()
        {
            var expected = @"<form id=""webexpress-webui-test-testfragmentcontrolform-form"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlForm));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for ModalForm.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlModalForm()
        {
            var expected = @"<form id=""webexpress-webui-test-testfragmentcontrolmodalform-form"" *>*</form>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlModalForm));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for ToolbarItemButton.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlToolbarItemButton()
        {
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontroltoolbaritembutton"" class=""wx-toolbar-button"" data-label=""TestFragmentControlToolbarItemButton""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlToolbarItemButton));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for ToolbarItemCombo.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlToolbarItemCombo()
        {
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontroltoolbaritemcombo"" class=""wx-toolbar-combo"" data-label=""TestFragmentControlToolbarItemCombo""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlToolbarItemCombo));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for ToolbarItemDropdown.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlToolbarItemDropdown()
        {
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontroltoolbaritemdropdown"" class=""wx-toolbar-dropdown"" data-label=""TestFragmentControlToolbarItemDropdown""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlToolbarItemDropdown));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for ToolbarItemLabel.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlToolbarItemLabel()
        {
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontroltoolbaritemlabel"" class=""wx-toolbar-label"" data-label=""TestFragmentControlToolbarItemLabel""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlToolbarItemLabel));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for Hidden.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentHidden()
        {
            var expected = (string)null;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentHidden));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for sidebar link items.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlSidebarItemLink()
        {
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontrolsidebaritemlink"" class=""wx-sidebar-link"" data-label=""TestFragmentControlSidebarItemLink""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlSidebarItemLink));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for sidebar header items.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlSidebarItemHeader()
        {
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontrolsidebaritemheader"" class=""wx-sidebar-header"" data-label=""TestFragmentControlSidebarItemHeader""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlSidebarItemHeader));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for sidebar control items.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlSidebarItemControl()
        {
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontrolsidebaritemcontrol"" class=""wx-sidebar-control""><div>TestFragmentControlSidebarItemControl</div></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlSidebarItemControl));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for sidebar control items.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlSidebarItemDynamic()
        {
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontrolsidebaritemdynamic"" class=""wx-sidebar-control""><div>FragmentControlSidebarItemDynamic</div></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlSidebarItemDynamic));

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }
    }
}
