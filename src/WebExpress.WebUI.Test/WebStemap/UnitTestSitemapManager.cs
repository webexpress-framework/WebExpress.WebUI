using WebExpress.WebCore.WebSitemap;
using WebExpress.WebUI.Test.Fixture;

namespace WebExpress.WebUI.Test.WebStemap
{
    /// <summary>
    /// Test the sitemap manager.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestSitemapManager
    {
        /// <summary>
        /// Test the SearchResource function of the sitemap.
        /// </summary>
        [Theory]
        [InlineData("http://localhost:8080/server/app/test", "webexpress.webui.test.testpage")]
        public void SearchResource(string uri, string id)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateHttpContextMock();
            var httpServerContext = UnitTestControlFixture.CreateHttpServerContextMock();
            var searchContext = Activator.CreateInstance<SearchContext>();
            componentHub.SitemapManager.Refresh();
            typeof(SearchContext).GetProperty("HttpServerContext").SetValue(searchContext, httpServerContext);
            typeof(SearchContext).GetProperty("Culture").SetValue(searchContext, httpServerContext.Culture);
            typeof(SearchContext).GetProperty("HttpContext").SetValue(searchContext, context);

            // act
            var searchResult = componentHub.SitemapManager.SearchResource(new Uri(uri), searchContext);

            var response = componentHub.EndpointManager.HandleRequest(UnitTestControlFixture.CreateRequestMock(), searchResult.EndpointContext);

            Assert.Equal(id, searchResult?.EndpointContext?.EndpointId.ToString());
        }
    }
}
