using System.Text;
using System.Text.RegularExpressions;
using WebExpress.WebCore.WebSitemap;
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
        /// the segment of its own, which is where the asset manager mounts it - for the bundle
        /// that joins its files as well.
        /// </summary>
        [Theory]
        [InlineData("/server/app/webexpress.webui/assets/css/webexpress.webui.webinclude.includestylesheet.bundle", "css")]
        [InlineData("/server/app/webexpress.webui/assets/js/webexpress.webui.webinclude.includejavascript.bundle", "js")]
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

        /// <summary>
        /// Tests that the links follow the order the includes declare their files in. A script
        /// builds on the ones before it and a stylesheet overrides the ones before it, so a
        /// link moved out of that order breaks the page without any error.
        /// </summary>
        [Fact]
        public void IncludeLinksKeepTheDeclaredOrder()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var context = UnitTestControlFixture.CreateRenderContextMock(application);
            var expected = componentHub.IncludeManager.GetIncludes(application)
                .SelectMany(include => include.LinkedFiles.Select(file => file.Route ?? componentHub.AssetManager
                    .GetVersionedAssetRoute(application, include.PluginContext, file.FileName)
                    .ToString()))
                .ToList();

            // act
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var links = visualTree.CssLinks.Concat(visualTree.HeaderScriptLinks).ToList();

            // validation
            Assert.Equal(expected.Where(x => x.EndsWith(".css")), links.Where(x => x.EndsWith(".css")));
            Assert.Equal(expected.Where(x => x.EndsWith(".js")), links.Where(x => x.EndsWith(".js")));
        }

        /// <summary>
        /// Tests that the bundle of the framework holds every file of its include, each one after
        /// the file declared before it. The bundle replaces several hundred links, so a file left
        /// out or moved would break the page as silently as a link out of order.
        /// </summary>
        [Theory]
        [InlineData(typeof(WebUI.WebInclude.IncludeJavaScript), ".js")]
        [InlineData(typeof(WebUI.WebInclude.IncludeStyleSheet), ".css")]
        public void BundleHoldsTheFilesInDeclaredOrder(Type includeType, string extension)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var include = componentHub.IncludeManager.GetIncludes(application, includeType).Single();
            var bundle = include.LinkedFiles.Single(x => x.FileName.EndsWith(".bundle" + extension));
            componentHub.SitemapManager.Refresh();

            // act
            var content = Encoding.UTF8.GetString((byte[])Send(componentHub, bundle.Route).Content);

            // validation
            var position = 0;

            foreach (var file in include.Files)
            {
                // the bundle holds each file as the file itself is delivered - a stylesheet with
                // the images it addresses rewritten to their fingerprints - without its byte order mark
                var text = Encoding.UTF8.GetString((byte[])Send(componentHub, file.Route).Content).TrimStart('﻿');
                var found = content.IndexOf(text, position, StringComparison.Ordinal);

                Assert.True(found >= position, $"'{file.FileName}' follows the file declared before it");
                position = found + text.Length;
            }

            Assert.Single(include.LinkedFiles);
        }

        /// <summary>
        /// Tests that every icon, flag and image the stylesheet bundle of the framework addresses
        /// is addressed by its fingerprint, on a route an asset is mounted on, so the browser
        /// keeps it for good instead of asking for each one again on every page.
        /// </summary>
        [Fact]
        public void StylesheetBundleAddressesFingerprintedImages()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var include = componentHub.IncludeManager.GetIncludes(application, typeof(WebUI.WebInclude.IncludeStyleSheet)).Single();
            var bundle = include.LinkedFiles.Single().Route;
            var mounted = componentHub.AssetManager.GetAssets(application).Select(x => x.Route.ToString()).ToHashSet();
            componentHub.SitemapManager.Refresh();

            // act
            var css = Encoding.UTF8.GetString((byte[])Send(componentHub, bundle).Content);
            var targets = Regex.Matches(css, @"url\([""']?(\.\.?/[^""')?#]+)")
                .Select(x => new Uri(new Uri("http://localhost" + bundle), x.Groups[1].Value).AbsolutePath)
                .ToList();

            // validation
            Assert.True(targets.Count > 1000, $"the icon set is addressed ({targets.Count})");
            Assert.All(targets, x => Assert.Matches(@"\.[0-9a-f]{12}\.[a-z0-9]+$", x));
            Assert.Equal([], targets.Where(x => !mounted.Contains(x)).Distinct().ToList());
        }

        /// <summary>
        /// Sends a request for a route of the test application to the endpoint registered there.
        /// </summary>
        /// <param name="componentHub">The component hub.</param>
        /// <param name="route">The route.</param>
        /// <returns>The response.</returns>
        private static WebCore.WebMessage.IResponse Send(WebCore.WebComponent.IComponentHub componentHub, string route)
        {
            var uri = new Uri("http://localhost:8080" + route);
            var httpServerContext = UnitTestControlFixture.CreateHttpServerContextMock();
            var searchContext = Activator.CreateInstance<SearchContext>();
            typeof(SearchContext).GetProperty("HttpServerContext").SetValue(searchContext, httpServerContext);
            typeof(SearchContext).GetProperty("Culture").SetValue(searchContext, httpServerContext.Culture);
            typeof(SearchContext).GetProperty("HttpContext").SetValue(searchContext, UnitTestControlFixture.CreateHttpContextMock());

            var searchResult = componentHub.SitemapManager.SearchResource(uri, searchContext);

            return componentHub.EndpointManager.HandleRequest(UnitTestControlFixture.CreateRequestMock("", uri.ToString()), searchResult.EndpointContext);
        }

        /// <summary>
        /// Tests that the include manager resolves the route of every mounted file once at
        /// registration, to the same versioned route the asset manager answers, so a page links
        /// it without composing the route again.
        /// </summary>
        [Fact]
        public void IncludeFilesCarryTheirVersionedRoute()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();

            // act
            var files = componentHub.IncludeManager.GetIncludes(application)
                .SelectMany(include => include.Files.Select(file => (Expected: componentHub.AssetManager
                    .GetVersionedAssetRoute(application, include.PluginContext, file.FileName)
                    .ToString(), file.Route)))
                .ToList();

            // validation
            Assert.NotEmpty(files);
            Assert.All(files, x => Assert.Equal(x.Expected, x.Route));
        }

        /// <summary>
        /// Tests that the includes of a plugin are linked after those of the plugin it builds
        /// on. The test plugin references the framework assembly, so its scripts and stylesheets
        /// must follow the framework's on every start, although the plugins are registered in
        /// hash order.
        /// </summary>
        [Theory]
        [InlineData(".css")]
        [InlineData(".js")]
        public void IncludeLinksFollowThePluginsTheyBuildOn(string extension)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var context = UnitTestControlFixture.CreateRenderContextMock(application);

            // act
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var links = visualTree.CssLinks.Concat(visualTree.HeaderScriptLinks)
                .Where(x => x.EndsWith(extension))
                .ToList();
            var lastFramework = links.FindLastIndex(x => x.StartsWith("/server/app/webexpress.webui/"));
            var firstOwn = links.FindIndex(x => x.StartsWith("/server/app/assets/"));

            // validation
            Assert.True(lastFramework >= 0 && firstOwn >= 0, "both plugins contribute an include");
            Assert.True(lastFramework < firstOwn, string.Join(Environment.NewLine, links));
        }
    }
}
