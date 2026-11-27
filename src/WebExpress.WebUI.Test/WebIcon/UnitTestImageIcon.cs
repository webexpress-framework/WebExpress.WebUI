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
    public class UnitTestImageIcon
    {
        /// <summary>
        /// Tests the web image icon.
        /// </summary>
        [Theory]
        [InlineData(typeof(ImageIcon), "/assets/img/webexpress.svg", @"<img style=""width: 16px; height: 16px;"" src=""/assets/img/webexpress.svg"" alt>")]
        [InlineData(typeof(ImageIconWebExpress), null, @"<img style=""width: 16px; height: 16px;"" src=""/assets/img/webexpress.svg"" alt>")]
        public void Id(Type iconType, string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);
            var size = new PropertySizeIcon(16, 16, TypeSizeUnit.Pixel);
            var icon = uri is null
                ? Activator.CreateInstance(iconType, [size, renderContext.PageContext.ApplicationContext]) as IIcon
                : Activator.CreateInstance(iconType, [new UriEndpoint(uri), size,]) as IIcon;

            // act
            var html = icon.Render(renderContext, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that an image icon whose picture is a file of a plugin is drawn from the address
        /// that carries the hash of its content - in the breadcrumb, the navigation and every list
        /// the picture appears in on each page - so the browser keeps it for good.
        /// </summary>
        [Fact]
        public void EmbeddedPictureIsAddressedByItsFingerprint()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).First();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);
            var mounted = componentHub.AssetManager.GetAssets(application).Select(x => x.Route.ToString()).ToHashSet();
            var icon = new ImageIconWebExpress(application);

            // act
            var html = icon.Render(renderContext, visualTree).ToString();

            // validation
            Assert.Matches(@"^/server/app/webexpress\.webui/assets/img/webexpress\.[0-9a-f]{12}\.svg$", icon.Uri.ToString());
            Assert.Contains(icon.Uri.ToString(), mounted);
            Assert.Contains($"src=\"{icon.Uri}\"", html);
        }

        /// <summary>
        /// Tests that a picture that is no file of a plugin - drawn by an endpoint, or carried in a
        /// data url - keeps the address it is given.
        /// </summary>
        [Theory]
        [InlineData("/server/app/api/workspaces/HELP/icon")]
        [InlineData("data:image/svg+xml;base64,PHN2Zy8+")]
        public void OtherPictureKeepsItsAddress(string uri)
        {
            // arrange
            UnitTestControlFixture.CreateAndRegisterComponentHubMock();

            // act
            var icon = ImageIcon.FromString(uri);

            // validation
            Assert.Equal(uri, icon.Uri.ToString());
        }
    }
}
