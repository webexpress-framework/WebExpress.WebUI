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

            if (id == null)
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
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlText), typeof(IScope), @"<p id=""webexpress-webui-test-testfragmentcontroltext"">TestFragmentControlText</p>")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlList), typeof(IScope), @"<ul id=""webexpress-webui-test-testfragmentcontrollist""><li></li></ul>")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlLink), typeof(IScope), @"<a id=""webexpress-webui-test-testfragmentcontrollink"" class=""link"">TestFragmentControlLink</a>")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlButtonLink), typeof(IScope), @"<a id=""webexpress-webui-test-testfragmentcontrolbuttonlink"" class=""btn"">TestFragmentControlButtonLink</a>")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlImage), typeof(IScope), @"<img id=""webexpress-webui-test-testfragmentcontrolimage"" src=""/a/b/c"">")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlDropdownItemLink), typeof(IScope), @"<div id=""webexpress.webui.test.testfragmentcontroldropdownitemlink"" class=""wx-dropdown-item"">TestFragmentControlDropdownItemLink</div>")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlNavigationItemLink), typeof(IScope), @"<a id=""webexpress-webui-test-testfragmentcontrolnavigationitemlink"" class=""link"">TestFragmentControlNavigationItemLink</a>")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlNavigation), typeof(IScope), @"<a id=""webexpress-webui-test-testfragmentcontrolnavigation"" class=""link"">TestFragmentControlNavigation</a>")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlPanel), typeof(IScope), @"<div id=""webexpress-webui-test-testfragmentcontrolpanel""><div>TestFragmentControlPanel</div></div>")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlPanelFlexbox), typeof(IScope), @"<div id=""webexpress-webui-test-testfragmentcontrolpanelflexbox""></div>")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlPanelTool), typeof(IScope), @"<div id=""webexpress-webui-test-testfragmentcontrolpaneltool"" class=""toolpanel border""><div class=""wx-webui-dropdown"" role=""button""></div><div><div>TestFragmentControlPanelTool</div></div></div>")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlSplitButtonItemLink), typeof(IScope), @"<a id=""webexpress-webui-test-testfragmentcontrolsplitbuttonitemlink"" class=""link"">TestFragmentControlSplitButtonItemLink</a>")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlTree), typeof(IScope), @"<ul id=""webexpress-webui-test-testfragmentcontroltree""><li></li></ul>")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlForm), typeof(IScope), @"<form id=""webexpress-webui-test-testfragmentcontrolform_form"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlModalForm), typeof(IScope), @"<form id=""webexpress-webui-test-testfragmentcontrolmodalform_form"" *>*</form>")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentControlToolbarItemButton), typeof(IScope), @"<div id=""webexpress.webui.test.testfragmentcontroltoolbaritembutton"" class=""wx-toolbar-button"" data-label=""TestFragmentControlToolbarItemButton""></div>")]
        [InlineData(typeof(TestApplication), typeof(TestSectionFragmentHidden), typeof(IScope), null)]
        public void Render(Type applicationType, Type sectionType, Type scopeType, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(applicationType).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CrerateRenderContextMock(application, [scopeType]);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);

            // test execution
            var html = componentHub.FragmentManager.Render(renderContext, visualTree, sectionType);

            Assert.NotNull(html);
            Assert.NotEmpty(html);
            AssertExtensions.EqualWithPlaceholders(expected, html.FirstOrDefault()?.ToString());
        }
    }
}
