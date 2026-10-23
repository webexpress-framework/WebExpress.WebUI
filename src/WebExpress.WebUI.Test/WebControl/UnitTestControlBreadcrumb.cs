using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the breadcrumb control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlBreadcrumb
    {
        /// <summary>
        /// Tests the id property of the breadcrumb control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<nav class=""wx-breadcrumb-nav wx-sm"" aria-label=""Breadcrumb""><ol class=""wx-breadcrumb""></ol></nav>")]
        [InlineData("id", @"<nav id=""id"" class=""wx-breadcrumb-nav wx-sm"" aria-label=""Breadcrumb""><ol class=""wx-breadcrumb""></ol></nav>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBreadcrumb(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the breadcrumb control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<nav class=""wx-breadcrumb-nav wx-sm"" aria-label=""Breadcrumb""><ol class=""wx-breadcrumb""></ol></nav>")]
        [InlineData("http://example.com/a/b/c", @"<nav class=""wx-breadcrumb-nav wx-sm"" aria-label=""Breadcrumb""><ol class=""wx-breadcrumb""></ol></nav>")]
        public void Uri(string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBreadcrumb
            {
                Uri = _ => new UriEndpoint(uri)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the breadcrumb control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeText.Default, @"<nav class=""wx-breadcrumb-nav"" aria-label=""Breadcrumb""><ol class=""wx-breadcrumb""></ol></nav>")]
        [InlineData(TypeSizeText.ExtraSmall, @"<nav class=""wx-breadcrumb-nav wx-esm"" aria-label=""Breadcrumb""><ol class=""wx-breadcrumb""></ol></nav>")]
        [InlineData(TypeSizeText.Small, @"<nav class=""wx-breadcrumb-nav wx-sm"" aria-label=""Breadcrumb""><ol class=""wx-breadcrumb""></ol></nav>")]
        [InlineData(TypeSizeText.Large, @"<nav class=""wx-breadcrumb-nav wx-lg"" aria-label=""Breadcrumb""><ol class=""wx-breadcrumb""></ol></nav>")]
        [InlineData(TypeSizeText.ExtraLarge, @"<nav class=""wx-breadcrumb-nav wx-elg"" aria-label=""Breadcrumb""><ol class=""wx-breadcrumb""></ol></nav>")]
        public void Size(TypeSizeText size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBreadcrumb
            {
                Size = _ => size,
                Uri = _ => new UriEndpoint("http://example.com/a/b/c")
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the prefix property of the breadcrumb control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<nav class=""wx-breadcrumb-nav wx-sm"" aria-label=""Breadcrumb""><ol class=""wx-breadcrumb""></ol></nav>")]
        [InlineData("Prefix", @"<nav class=""wx-breadcrumb-nav wx-sm"" aria-label=""Breadcrumb""><ol class=""wx-breadcrumb""><li class=""wx-breadcrumb-prefix""><div>Prefix</div></li></ol></nav>")]
        public void Prefix(string prefix, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBreadcrumb { Prefix = _ => prefix, Uri = _ => new UriEndpoint("http://example.com") };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the take last property of the breadcrumb control.
        /// </summary>
        [Theory]
        [InlineData((ushort)5, @"<nav class=""wx-breadcrumb-nav wx-sm"" aria-label=""Breadcrumb""><ol class=""wx-breadcrumb""></ol></nav>")]
        [InlineData(3, @"<nav class=""wx-breadcrumb-nav wx-sm"" aria-label=""Breadcrumb""><ol class=""wx-breadcrumb""></ol></nav>")]
        public void TakeLast(ushort takeLast, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBreadcrumb { TakeLast = _ => takeLast, Uri = _ => new UriEndpoint("http://example.com") };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the render function of the breadcrumb control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<nav class=""wx-breadcrumb-nav wx-sm"" aria-label=""Breadcrumb""><ol class=""wx-breadcrumb""></ol></nav>")]
        [InlineData("http://localhost:80/app/page", @"<nav class=""wx-breadcrumb-nav wx-sm"" aria-label=""Breadcrumb""><ol class=""wx-breadcrumb""></ol></nav>")]
        public void Render(string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);
            var uriResource = new UriEndpoint(uri);
            var control = new ControlBreadcrumb()
            {
                Uri = _ => !string.IsNullOrWhiteSpace(uri) ? uriResource : null
            };

            var uriProperty = renderContext.Request.GetType().GetProperty("Uri");
            uriProperty.SetValue(renderContext.Request, uriResource);

            // act
            var html = control.Render(renderContext, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
