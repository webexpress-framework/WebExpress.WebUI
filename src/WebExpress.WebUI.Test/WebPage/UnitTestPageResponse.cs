using WebExpress.WebCore.WebApplication;
using WebExpress.WebCore.WebEndpoint;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebPage
{
    /// <summary>
    /// Represents a set of unit tests for verifying the behavior of page response generation in a visual tree control.
    /// </summary>
    public class UnitTestPageResponse
    {
        /// <summary>
        /// Tests the GetResponse method to ensure it returns a valid.
        /// </summary>
        [Fact]
        public void GetResponse200()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTreeContext = new VisualTreeContext(context);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            // act
            var response = visualTree.GetResponse(visualTreeContext);

            // validation
            Assert.NotNull(response);
            Assert.IsType<ResponseOK>(response);
        }

        /// <summary>
        /// Tests the behavior of the GetResponse method when the status code is set to
        /// 201.
        /// </summary>
        [Fact]
        public void GetResponse201()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTreeContext = new VisualTreeContext(context);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext)
            {
                StatusCode = 201
            };

            // act
            var response = visualTree.GetResponse(visualTreeContext);

            // validation
            Assert.NotNull(response);
            Assert.IsType<ResponseCreated>(response);
        }

        /// <summary>
        /// Tests the behavior of the GetResponse method when the status code is set to
        /// 204.
        /// </summary>
        [Fact]
        public void GetResponse204()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTreeContext = new VisualTreeContext(context);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext)
            {
                StatusCode = 204
            };

            // act
            var response = visualTree.GetResponse(visualTreeContext);

            // validation
            Assert.NotNull(response);
            Assert.IsType<ResponseNoContent>(response);
        }

        /// <summary>
        /// Tests the behavior of the GetResponse method when the status code is set to
        /// 301.
        /// </summary>
        [Fact]
        public void GetResponse301()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTreeContext = new VisualTreeContext(context);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext)
            {
                StatusCode = 301
            };

            // act
            var response = visualTree.GetResponse(visualTreeContext);

            // validation
            Assert.NotNull(response);
            Assert.IsType<ResponseMovedPermanently>(response);
        }

        /// <summary>
        /// Tests the behavior of the GetResponse method when the status code is set to
        /// 302.
        /// </summary>
        [Fact]
        public void GetResponse302()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTreeContext = new VisualTreeContext(context);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext)
            {
                StatusCode = 302
            };

            // act
            var response = visualTree.GetResponse(visualTreeContext);

            // validation
            Assert.NotNull(response);
            Assert.IsType<ResponseMovedTemporarily>(response);
        }

        /// <summary>
        /// Tests the behavior of the GetResponse method when the status code is set to
        /// 400.
        /// </summary>
        [Fact]
        public void GetResponse400()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTreeContext = new VisualTreeContext(context);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext)
            {
                StatusCode = 400
            };

            // act
            var response = visualTree.GetResponse(visualTreeContext);

            // validation
            Assert.NotNull(response);
            Assert.IsType<ResponseBadRequest>(response);
        }

        /// <summary>
        /// Tests the behavior of the GetResponse method when the status code is set to
        /// 401.
        /// </summary>
        [Fact]
        public void GetResponse401()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTreeContext = new VisualTreeContext(context);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext)
            {
                StatusCode = 401
            };

            // act
            var response = visualTree.GetResponse(visualTreeContext);

            // validation
            Assert.NotNull(response);
            Assert.IsType<ResponseUnauthorized>(response);
        }

        /// <summary>
        /// Tests the behavior of the GetResponse method when the status code is set to
        /// 404.
        /// </summary>
        [Fact]
        public void GetResponse404()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTreeContext = new VisualTreeContext(context);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext)
            {
                StatusCode = 404
            };

            // act
            var response = visualTree.GetResponse(visualTreeContext);

            // validation
            Assert.NotNull(response);
            Assert.IsType<ResponseNotFound>(response);
        }

        /// <summary>
        /// Tests the behavior of the GetResponse method when the status code is set to
        /// 422.
        /// </summary>
        [Fact]
        public void GetResponse422()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTreeContext = new VisualTreeContext(context);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext)
            {
                StatusCode = 422
            };

            // act
            var response = visualTree.GetResponse(visualTreeContext);

            // validation
            Assert.NotNull(response);
            Assert.IsType<ResponseUnprocessableEntity>(response);
        }

        /// <summary>
        /// Tests the behavior of the GetResponse method when the status code is set to
        /// 500.
        /// </summary>
        [Fact]
        public void GetResponse500()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTreeContext = new VisualTreeContext(context);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext)
            {
                StatusCode = 500
            };

            // act
            var response = visualTree.GetResponse(visualTreeContext);

            // validation
            Assert.NotNull(response);
            Assert.IsType<ResponseInternalServerError>(response);
        }

        /// <summary>
        /// Validates that the base URL of the response matches the expected value.
        /// </summary>
        [Theory]
        [InlineData("/route")]
        public void Base(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var applicationContext = new ApplicationContext();
            var routeProperty = typeof(ApplicationContext).GetProperty("Route");
            routeProperty?.SetValue(applicationContext, new RouteEndpoint("/route"));
            var context = UnitTestControlFixture.CreateRenderContextMock(applicationContext);
            var visualTreeContext = new VisualTreeContext(context);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            // act
            var response = visualTree.GetResponse(visualTreeContext);

            // validation
            Assert.NotNull(response);
            Assert.Equal(expected, (response.Content as HtmlElementRootHtml)?.Head.Base);
            Assert.Contains($"<base href=\"{expected}\">", response.Content.ToString());
        }
    }
}
