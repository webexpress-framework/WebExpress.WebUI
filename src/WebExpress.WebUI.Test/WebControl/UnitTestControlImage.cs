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
        [InlineData(null, @"<img alt>")]
        [InlineData("id", @"<img id=""id"" alt>")]
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

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the route property of the image control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<img alt>")]
        [InlineData("/a", @"<img src=""/a"" alt>")]
        [InlineData("/a/b", @"<img src=""/a/b"" alt>")]
        public void Route(string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlImage()
            {
                Uri = _ => uri is not null ? new UriEndpoint(uri) : null,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the width property of the image control.
        /// </summary>
        [Theory]
        [InlineData(-1, @"<img alt>")]
        [InlineData(0, @"<img alt>")]
        [InlineData(1, @"<img alt width=""1"">")]
        public void Width(int width, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlImage()
            {
                Width = _ => width,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the height property of the image control.
        /// </summary>
        [Theory]
        [InlineData(-1, @"<img alt>")]
        [InlineData(0, @"<img alt>")]
        [InlineData(1, @"<img alt height=""1"">")]
        public void Height(int height, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlImage()
            {
                Height = _ => height,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the image control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<img alt>")]
        [InlineData("a", @"<img alt=""a"" title=""a"">")]
        [InlineData("b", @"<img alt=""b"" title=""b"">")]
        [InlineData("a<br/>b", @"<img alt=""a<br/>b"" title=""a<br/>b"">")]
        public void Tooltip(string tooltip, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlImage()
            {
                Tooltip = _ => tooltip
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
