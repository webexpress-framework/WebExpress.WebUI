using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebIcon
{
    /// <summary>
    /// Tests the web image icon.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestImageIcon
    {
        /// <summary>
        /// Tests the web image icon.
        /// </summary>
        [Theory]
        [InlineData(typeof(ImageIcon), "/assets/img/webexpress.svg", @"<img style=""width: 16px; height: 16px;"" src=""/assets/img/webexpress.svg"">")]
        [InlineData(typeof(ImageIconWebExpress), null, @"<img style=""width: 16px; height: 16px;"" src=""/assets/img/webexpress.svg"">")]
        public void Id(Type iconType, string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);
            var size = new PropertySizeIcon(16, 16, TypeSizeUnit.Pixel);
            var icon = uri == null
                ? Activator.CreateInstance(iconType, [size, renderContext.PageContext.ApplicationContext]) as IIcon
                : Activator.CreateInstance(iconType, [new UriEndpoint(uri), size,]) as IIcon;

            // test execution
            var html = icon.Render(renderContext, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
