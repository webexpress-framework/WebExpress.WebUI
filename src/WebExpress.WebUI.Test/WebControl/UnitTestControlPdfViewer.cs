using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the pdf viewer control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPdfViewer
    {
        private const string Fallback = @"<div class=""wx-webui-pdf-viewer-fallback""><p>The PDF document cannot be displayed here.</p></div>";

        /// <summary>
        /// Tests the id property of the pdf viewer control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<object class=""wx-webui-pdf-viewer"" type=""application/pdf"">" + Fallback + "</object>")]
        [InlineData("id", @"<object id=""id"" class=""wx-webui-pdf-viewer"" type=""application/pdf"">" + Fallback + "</object>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPdfViewer(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the pdf viewer control. The address is both the embedded
        /// file and the target of the fallback link.
        /// </summary>
        [Theory]
        [InlineData(null, @"<object class=""wx-webui-pdf-viewer"" type=""application/pdf"">" + Fallback + "</object>")]
        [InlineData("/a.pdf", @"<object class=""wx-webui-pdf-viewer"" data=""/a.pdf"" type=""application/pdf""><div class=""wx-webui-pdf-viewer-fallback""><p>The PDF document cannot be displayed here.</p><a href=""/a.pdf"">Open PDF</a></div></object>")]
        [InlineData("/a?b=1&c=2", @"<object class=""wx-webui-pdf-viewer"" data=""/a?b=1&amp;c=2"" type=""application/pdf""><div class=""wx-webui-pdf-viewer-fallback""><p>The PDF document cannot be displayed here.</p><a href=""/a?b=1&amp;c=2"">Open PDF</a></div></object>")]
        public void Uri(string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPdfViewer()
            {
                Uri = _ => uri is not null ? new UriEndpoint(uri) : null,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the label property of the pdf viewer control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<object class=""wx-webui-pdf-viewer"" type=""application/pdf"">*</object>")]
        [InlineData("", @"<object class=""wx-webui-pdf-viewer"" type=""application/pdf"">*</object>")]
        [InlineData("Invoice", @"<object class=""wx-webui-pdf-viewer"" type=""application/pdf"" aria-label=""Invoice"">*</object>")]
        [InlineData("webexpress.webui:pdfviewer.open", @"<object class=""wx-webui-pdf-viewer"" type=""application/pdf"" aria-label=""Open PDF"">*</object>")]
        public void Label(string label, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPdfViewer()
            {
                Label = _ => label
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the height property of the pdf viewer control.
        /// </summary>
        [Theory]
        [InlineData(-1, @"<object class=""wx-webui-pdf-viewer"" type=""application/pdf"">*</object>")]
        [InlineData(0, @"<object class=""wx-webui-pdf-viewer"" type=""application/pdf"">*</object>")]
        [InlineData(600, @"<object class=""wx-webui-pdf-viewer"" style=""height: 600px;"" type=""application/pdf"">*</object>")]
        public void Height(int height, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPdfViewer()
            {
                Height = _ => height
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the open parameters travel in the fragment of the embedded address, while
        /// the fallback link keeps the plain address.
        /// </summary>
        [Theory]
        [InlineData("/a.pdf", 0, 0, true, @"data=""/a.pdf""")]
        [InlineData("/a.pdf", 3, 0, true, @"data=""/a.pdf#page=3""")]
        [InlineData("/a.pdf", -1, 0, true, @"data=""/a.pdf""")]
        [InlineData("/a.pdf", 0, 150, true, @"data=""/a.pdf#zoom=150""")]
        [InlineData("/a.pdf", 0, 0, false, @"data=""/a.pdf#toolbar=0""")]
        [InlineData("/a.pdf", 2, 75, false, @"data=""/a.pdf#page=2&amp;zoom=75&amp;toolbar=0""")]
        [InlineData("/a.pdf#nameddest=intro", 2, 0, true, @"data=""/a.pdf#nameddest=intro&amp;page=2""")]
        public void OpenParameters(string uri, int page, int zoom, bool toolbar, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPdfViewer()
            {
                Uri = _ => new UriEndpoint(uri),
                Page = _ => page,
                Zoom = _ => zoom,
                Toolbar = _ => toolbar
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders($@"<object class=""wx-webui-pdf-viewer"" {expected} type=""application/pdf"">*<a href=""{uri}"">Open PDF</a></div></object>", html);
        }

        /// <summary>
        /// Tests that the open parameters are dropped without an address, since they would
        /// otherwise turn into an address of their own.
        /// </summary>
        [Fact]
        public void OpenParametersWithoutUri()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPdfViewer()
            {
                Page = _ => 2,
                Zoom = _ => 50,
                Toolbar = _ => false
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<object class=""wx-webui-pdf-viewer"" type=""application/pdf"">" + Fallback + "</object>", html);
        }
    }
}
