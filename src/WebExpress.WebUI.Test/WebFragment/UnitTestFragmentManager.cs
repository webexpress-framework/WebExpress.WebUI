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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(applicationType).FirstOrDefault();

            // act
            var fragment = componentHub.FragmentManager.GetFragments(application, fragmentType);

            if (id is null)
            {
                Assert.Empty(fragment);
                return;
            }

            // validation
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(applicationType).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [scopeType]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render
            (
                renderContext,
                visualTree,
                typeof(TestSectionFragmentControlText)
            );

            // validation
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
            // arrange
            var expected = @"<ul id=""webexpress-webui-test-testfragmentcontrollist""><li></li></ul>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlList));

            // validation
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
            // arrange
            var expected = @"<a id=""webexpress-webui-test-testfragmentcontrollink"" class=""wx-link"">TestFragmentControlLink</a>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlLink));

            // validation
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
            // arrange
            var expected = @"<a id=""webexpress-webui-test-testfragmentcontrolbuttonlink"" class=""btn"">TestFragmentControlButtonLink</a>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlButtonLink));

            // validation
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
            // arrange
            var expected = @"<img id=""webexpress-webui-test-testfragmentcontrolimage"" src=""/a/b/c"">";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlImage));

            // validation
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
            // arrange
            var expected = @"<div id=""webexpress-webui-test-testfragmentcontroldropdown"" class=""wx-webui-dropdown"" role=""button"" data-label=""TestFragmentControlDropdown""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlDropdown));

            // validation
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
            // arrange
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontroldropdownitemlink"" class=""wx-dropdown-item"">TestFragmentControlDropdownItemLink</div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlDropdownItemLink));

            // validation
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
            // arrange
            var expected = @"<a id=""webexpress-webui-test-testfragmentcontrolnavigationitemdropdown"" class=""wx-link"">TestFragmentControlNavigationItemDropdown</a>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlNavigationItemDropdown));

            // validation
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
            // arrange
            var expected = @"<a id=""webexpress-webui-test-testfragmentcontrolnavigationitemlink"" class=""wx-link"">TestFragmentControlNavigationItemLink</a>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlNavigationItemLink));

            // validation
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
            // arrange
            var expected = @"<a id=""webexpress-webui-test-testfragmentcontrolnavigation"" class=""wx-link"">TestFragmentControlNavigation</a>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlNavigation));

            // validation
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
            // arrange
            var expected = @"<div id=""webexpress-webui-test-testfragmentcontrolpanel""><div>TestFragmentControlPanel</div></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlPanel));

            // validation
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
            // arrange
            var expected = @"<div id=""webexpress-webui-test-testfragmentcontrolpanelflex""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlPanelFlex));

            // validation
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
            // arrange
            var expected = @"<div id=""webexpress-webui-test-testfragmentcontrolpaneltool"" class=""toolpanel border""><div class=""wx-webui-dropdown"" role=""button""></div><div><div>TestFragmentControlPanelTool</div></div></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlPanelTool));

            // validation
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
            // arrange
            var expected = @"<a id=""webexpress-webui-test-testfragmentcontrolsplitbuttonitemlink"" class=""wx-link"">TestFragmentControlSplitButtonItemLink</a>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlSplitButtonItemLink));

            // validation
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
            // arrange
            var expected = @"<ul id=""webexpress-webui-test-testfragmentcontroltree""><li></li></ul>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlTree));

            // validation
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
            // arrange
            var expected = @"<form id=""webexpress-webui-test-testfragmentcontrolform-form"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlForm));

            // validation
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
            // arrange
            var expected = @"<form id=""webexpress-webui-test-testfragmentcontrolmodalform-form"" *>*</form>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlModalForm));

            // validation
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
            // arrange
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontroltoolbaritembutton"" class=""wx-toolbar-button"" data-label=""TestFragmentControlToolbarItemButton""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlToolbarItemButton));

            // validation
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
            // arrange
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontroltoolbaritemcombo"" class=""wx-toolbar-combo"" data-label=""TestFragmentControlToolbarItemCombo""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlToolbarItemCombo));

            // validation
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
            // arrange
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontroltoolbaritemdropdown"" class=""wx-toolbar-dropdown"" data-label=""TestFragmentControlToolbarItemDropdown""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlToolbarItemDropdown));

            // validation
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
            // arrange
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontroltoolbaritemlabel"" class=""wx-toolbar-label"" data-label=""TestFragmentControlToolbarItemLabel""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlToolbarItemLabel));

            // validation
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
            // arrange
            var expected = (string)null;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentHidden));

            // validation
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
            // arrange
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontrolsidebaritemlink"" class=""wx-sidebar-link"" data-label=""TestFragmentControlSidebarItemLink""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlSidebarItemLink));

            // validation
            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for sidebar icon items.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlSidebarItemIcon()
        {
            // arrange
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontrolsidebaritemicon"" class=""wx-sidebar-icon"" data-icon-text=""TestFragmentControlSidebarItemIcon""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlSidebarItemIcon));

            // validation
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
            // arrange
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontrolsidebaritemheader"" class=""wx-sidebar-header"" data-label=""TestFragmentControlSidebarItemHeader""></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlSidebarItemHeader));

            // validation
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
            // arrange
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontrolsidebaritemcontrol"" class=""wx-sidebar-control""><div>TestFragmentControlSidebarItemControl</div></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlSidebarItemControl));

            // validation
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
            // arrange
            var expected = @"<div id=""webexpress.webui.test.testfragmentcontrolsidebaritemdynamic"" class=""wx-sidebar-control""><div>FragmentControlSidebarItemDynamic</div></div>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlSidebarItemDynamic));

            // validation
            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }

        /// <summary>
        /// Test the render function of the fragment manager for avatar control items.
        /// </summary>
        [Fact]
        public void Render_TestSectionFragmentControlAvatar()
        {
            // arrange
            var expected = @"<a id=""webexpress-webui-test-testfragmentcontrollink"" class=""wx-link"">TestFragmentControlLink</a>";
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application, [typeof(IScope)]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // act
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, typeof(TestSectionFragmentControlLink));

            // validation
            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }
    }
}
