using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebPage
{
    /// <summary>
    /// Tests that the links a visual tree renders for the declared includes address the
    /// route the asset manager actually mounts the files on. A link that does not is a 404
    /// the browser accepts as an empty stylesheet, so nothing about the page reports it.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestVisualTreeControlInclude
    {
        /// <summary>
        /// Tests that an include of the plugin owning the application is linked on the
        /// application route. That plugin gets no segment of its own from the asset manager,
        /// so a link carrying one points at nothing.
        /// </summary>
        [Theory]
        [InlineData("/server/app/assets/css/testinclude.css")]
        [InlineData("/server/app/assets/js/testinclude.js")]
        public void OwnPluginIncludeIsLinkedOnTheApplicationRoute(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var context = UnitTestControlFixture.CreateRenderContextMock(application);

            // act
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var links = visualTree.CssLinks.Concat(visualTree.HeaderScriptLinks).ToList();

            // validation
            Assert.Contains(expected, links);
            Assert.DoesNotContain("/server/app/webexpress.webui.test" + expected["/server/app".Length..], links);
        }

        /// <summary>
        /// Tests that an include of a plugin that only contributes to the application keeps
        /// the segment of its own, which is where the asset manager mounts it.
        /// </summary>
        [Theory]
        [InlineData("/server/app/webexpress.webui/assets/css/webexpress.webui.css")]
        [InlineData("/server/app/webexpress.webui/assets/js/webexpress.webui.js")]
        public void ForeignPluginIncludeKeepsItsPluginSegment(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var context = UnitTestControlFixture.CreateRenderContextMock(application);

            // act
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var links = visualTree.CssLinks.Concat(visualTree.HeaderScriptLinks).ToList();

            // validation
            Assert.Contains(expected, links);
        }

        /// <summary>
        /// Tests that every link a visual tree renders for an include resolves to a
        /// registered asset. This is the invariant the two independently composed routes
        /// used to break, and it holds for both the owning and the contributing plugin.
        /// </summary>
        [Fact]
        public void EveryIncludeLinkAddressesARegisteredAsset()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var context = UnitTestControlFixture.CreateRenderContextMock(application);
            var mounted = componentHub.AssetManager.GetAssets(application)
                .Select(x => x.Route.ToString())
                .ToHashSet();

            // act
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var links = visualTree.CssLinks.Concat(visualTree.HeaderScriptLinks).ToList();
            var dead = links.Where(x => !mounted.Contains(x)).ToList();

            // validation
            Assert.NotEmpty(links);
            Assert.Equal([], dead);
        }
    }
}
