using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the breadcrumb control.
    /// </summary>
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

        /// <summary>
        /// Tests that a segment standing for a place in a hierarchy contributes a crumb per
        /// ancestor, leaves a hidden one out and gives a crumb with a menu its dropdown.
        /// </summary>
        [Fact]
        public void TrailSegment()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).FirstOrDefault();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock(application);
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);
            var uri = new UriEndpoint(new UriEndpoint("http://localhost:80/"), [new UriPathSegmentRoot(), new TestTrailSegment("guide")]);
            var control = new ControlBreadcrumb()
            {
                Uri = _ => uri
            };

            // act
            var html = control.Render(renderContext, visualTree).ToString();

            // validation
            Assert.Contains("<a href=\"/wiki/root\">Root</a>", html);
            Assert.Contains("<a href=\"/wiki/chapter\">Chapter</a>", html);
            Assert.DoesNotContain("Hidden", html);
            Assert.Contains("<li class=\"wx-breadcrumb-menu\">", html);
            Assert.Contains("/wiki/sibling", html);
            Assert.Contains("<a href=\"/wiki/guide\" aria-current=\"page\">Guide</a>", html);
            Assert.True(html.IndexOf("Root") < html.IndexOf("Chapter") && html.IndexOf("Chapter") < html.IndexOf("Guide"));
        }

        /// <summary>
        /// A segment that stands for a page with two ancestors in a hierarchy.
        /// </summary>
        /// <param name="value">The value of the segment.</param>
        private sealed class TestTrailSegment(string value) : IUriPathSegmentTrail
        {
            /// <summary>
            /// Gets the id.
            /// </summary>
            public string Id => Value;

            /// <summary>
            /// Gets the value.
            /// </summary>
            public string Value { get; } = value;

            /// <summary>
            /// Gets no tag.
            /// </summary>
            public object Tag => null;

            /// <summary>
            /// Gets that the segment is not empty.
            /// </summary>
            public bool IsEmpty => false;

            /// <summary>
            /// Gets or sets whether the segment is hidden.
            /// </summary>
            public bool IsHidden { get; set; }

            /// <summary>
            /// Gets or sets the address the segment links to.
            /// </summary>
            public IUri Uri { get; set; }

            /// <summary>
            /// Tells whether a value is the segment's value.
            /// </summary>
            /// <param name="value">The value.</param>
            /// <returns>True for the same value.</returns>
            public bool IsMatched(string value) => value == Value;

            /// <summary>
            /// Copies the segment with its own type, as a route copies its segments.
            /// </summary>
            /// <returns>The copy.</returns>
            public IUriPathSegment Copy() => new TestTrailSegment(Value) { IsHidden = IsHidden, Uri = Uri };

            /// <summary>
            /// Compares the values.
            /// </summary>
            /// <param name="obj">The other segment.</param>
            /// <returns>True for the same value.</returns>
            public bool Equals(IUriPathSegment obj) => obj?.Value == Value;

            /// <summary>
            /// Returns the value.
            /// </summary>
            /// <returns>The value.</returns>
            public override string ToString() => Value;

            /// <summary>
            /// Returns the ancestors and the page itself.
            /// </summary>
            /// <param name="renderContext">The context of the page.</param>
            /// <returns>The crumbs.</returns>
            public IEnumerable<UriTrailCrumb> GetTrail(WebExpress.WebCore.WebPage.IRenderContext renderContext)
            {
                yield return new UriTrailCrumb { Text = "Root", Uri = new UriEndpoint("/wiki/root") };
                yield return new UriTrailCrumb { Text = "Hidden", Uri = new UriEndpoint("/wiki/hidden"), Hidden = true };
                yield return new UriTrailCrumb
                {
                    Text = "Chapter",
                    Uri = new UriEndpoint("/wiki/chapter"),
                    Menu = [new UriTrailCrumb { Text = "Sibling", Uri = new UriEndpoint("/wiki/sibling") }]
                };
                yield return new UriTrailCrumb { Text = "Guide", Uri = new UriEndpoint("/wiki/guide") };
            }
        }
    }
}
