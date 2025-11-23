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
        [InlineData(null, @"<ol class=""wx-breadcrumb wx-sm""></ol>")]
        [InlineData("id", @"<ol id=""id"" class=""wx-breadcrumb wx-sm""></ol>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBreadcrumb(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the breadcrumb control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<ol class=""wx-breadcrumb wx-sm""></ol>")]
        [InlineData("http://example.com/a/b/c", @"<ol class=""wx-breadcrumb wx-sm""></ol>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBreadcrumb
            {
                Uri = new UriEndpoint(uri)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the breadcrumb control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeText.Default, @"<ol class=""wx-breadcrumb""></ol>")]
        [InlineData(TypeSizeText.ExtraSmall, @"<ol class=""wx-breadcrumb wx-esm""></ol>")]
        [InlineData(TypeSizeText.Small, @"<ol class=""wx-breadcrumb wx-sm""></ol>")]
        [InlineData(TypeSizeText.Large, @"<ol class=""wx-breadcrumb wx-lg""></ol>")]
        [InlineData(TypeSizeText.ExtraLarge, @"<ol class=""wx-breadcrumb wx-elg""></ol>")]
        public void Size(TypeSizeText size, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBreadcrumb
            {
                Size = size,
                Uri = new UriEndpoint("http://example.com/a/b/c")
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the prefix property of the breadcrumb control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<ol class=""wx-breadcrumb wx-sm""></ol>")]
        [InlineData("Prefix", @"<ol class=""wx-breadcrumb wx-sm""><li class=""wx-breadcrumb-prefix""><div>Prefix</div></li></ol>")]
        public void Prefix(string prefix, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBreadcrumb { Prefix = prefix, Uri = new UriEndpoint("http://example.com") };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the take last property of the breadcrumb control.
        /// </summary>
        [Theory]
        [InlineData((ushort)5, @"<ol class=""wx-breadcrumb wx-sm""></ol>")]
        [InlineData(3, @"<ol class=""wx-breadcrumb wx-sm""></ol>")]
        public void TakeLast(ushort takeLast, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBreadcrumb { TakeLast = takeLast, Uri = new UriEndpoint("http://example.com") };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the render function of the breadcrumb control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<ol class=""wx-breadcrumb wx-sm""></ol>")]
        [InlineData("http://localhost:80/app/page", @"<ol class=""wx-breadcrumb wx-sm""></ol>")]
        public void Render(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);
            var uriResource = new UriEndpoint(uri);
            var control = new ControlBreadcrumb()
            {
                Uri = !string.IsNullOrWhiteSpace(uri) ? uriResource : null
            };

            var uriProperty = renderContext.Request.GetType().GetProperty("Uri");
            uriProperty.SetValue(renderContext.Request, uriResource);

            // test execution
            var html = control.Render(renderContext, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
