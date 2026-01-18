using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the image control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlImage
    {
        /// <summary>
        /// Tests the id property of the image control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<img>")]
        [InlineData("id", @"<img id=""id"">")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlImage(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the route property of the image control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<img>")]
        [InlineData("/a", @"<img src=""/a"">")]
        [InlineData("/a/b", @"<img src=""/a/b"">")]
        public void Route(string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlImage()
            {
                Uri = uri is not null ? new UriEndpoint(uri) : null,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the width property of the image control.
        /// </summary>
        [Theory]
        [InlineData(-1, @"<img>")]
        [InlineData(0, @"<img>")]
        [InlineData(1, @"<img width=""1"">")]
        public void Width(int width, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlImage()
            {
                Width = width,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the height property of the image control.
        /// </summary>
        [Theory]
        [InlineData(-1, @"<img>")]
        [InlineData(0, @"<img>")]
        [InlineData(1, @"<img height=""1"">")]
        public void Height(int height, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlImage()
            {
                Height = height,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the image control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<img>")]
        [InlineData("a", @"<img alt=""a"" data-toggle=""tooltip"" title=""a"">")]
        [InlineData("b", @"<img alt=""b"" data-toggle=""tooltip"" title=""b"">")]
        [InlineData("a<br/>b", @"<img alt=""a<br/>b"" data-toggle=""tooltip"" title=""a<br/>b"">")]
        public void Tooltip(string tooltip, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlImage()
            {
                Tooltip = tooltip
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
