using System.Text.RegularExpressions;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebPage
{
    /// <summary>
    /// Tests that the links a visual tree renders for the declared includes address the
    /// route the asset manager actually mounts the files on. A link that does not is a 404
    /// the browser accepts as an empty stylesheet, so nothing about the page reports it.
    /// </summary>
    public class UnitTestVisualTreeControlInclude
    {
        /// <summary>
        /// Tests that an include of the plugin owning the application is linked on the
        /// application route. That plugin gets no segment of its own from the asset manager,
        /// so a link carrying one points at nothing. The link carries the hash of the content
        /// in the file name, which lets the browser keep the file for good.
        /// </summary>
        [Theory]
        [InlineData("/server/app/assets/css/testinclude", "css")]
        [InlineData("/server/app/assets/js/testinclude", "js")]
        public void OwnPluginIncludeIsLinkedOnTheApplicationRoute(string expected, string extension)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var context = UnitTestControlFixture.CreateRenderContextMock(application);

            // act
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var links = visualTree.CssLinks.Concat(visualTree.HeaderScriptLinks).ToList();

            // validation
            Assert.Contains(links, x => Regex.IsMatch(x, $@"^{Regex.Escape(expected)}\.[0-9a-f]{{12}}\.{extension}$"));
            Assert.DoesNotContain(links, x => x.StartsWith("/server/app/webexpress.webui.test/"));
        }

        /// <summary>
        /// Tests that an include of a plugin that only contributes to the application keeps
        /// the segment of its own, which is where the asset manager mounts it.
        /// </summary>
        [Theory]
        [InlineData("/server/app/webexpress.webui/assets/css/webexpress.webui", "css")]
        [InlineData("/server/app/webexpress.webui/assets/js/webexpress.webui", "js")]
        public void ForeignPluginIncludeKeepsItsPluginSegment(string expected, string extension)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var context = UnitTestControlFixture.CreateRenderContextMock(application);

            // act
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var links = visualTree.CssLinks.Concat(visualTree.HeaderScriptLinks).ToList();

            // validation
            Assert.Contains(links, x => Regex.IsMatch(x, $@"^{Regex.Escape(expected)}\.[0-9a-f]{{12}}\.{extension}$"));
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
