using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the media control panel.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPanelMedia
    {
        /// <summary>
        /// Tests the id property of the media control panel.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""media""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData("id", @"<div id=""id"" class=""media""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelMedia(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the media control panel.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<div class=""media""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData(TypeColorBackground.Primary, @"<div class=""media bg-primary""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData(TypeColorBackground.Secondary, @"<div class=""media bg-secondary""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData(TypeColorBackground.Warning, @"<div class=""media bg-warning""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData(TypeColorBackground.Danger, @"<div class=""media bg-danger""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData(TypeColorBackground.Dark, @"<div class=""media bg-dark""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData(TypeColorBackground.Light, @"<div class=""media bg-light""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData(TypeColorBackground.Transparent, @"<div class=""media bg-transparent""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelMedia()
            {
                BackgroundColor = new PropertyColorBackground(backgroundColor)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the direction property of the media control panel.
        /// </summary>
        [Theory]
        [InlineData(TypeDirection.Default, @"<div class=""media""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData(TypeDirection.Vertical, @"<div class=""media flex-column""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData(TypeDirection.VerticalReverse, @"<div class=""media flex-column-reverse""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData(TypeDirection.Horizontal, @"<div class=""media flex-row""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData(TypeDirection.HorizontalReverse, @"<div class=""media flex-row-reverse""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        public void Direction(TypeDirection direction, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelMedia()
            {
                Direction = direction,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the fluid property of the media control panel.
        /// </summary>
        [Theory]
        [InlineData(TypePanelContainer.None, @"<div class=""media""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData(TypePanelContainer.Default, @"<div class=""media container""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData(TypePanelContainer.Fluid, @"<div class=""media container-fluid""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        public void Fluid(TypePanelContainer fluid, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelMedia()
            {
                Fluid = fluid,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title property of the media control panel.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""media""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData("Title", @"<div class=""media""><img class=""me-3 mt-3 ""><div class=""media-body""><h4>Title</h4></div></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""media""><img class=""me-3 mt-3 ""><div class=""media-body""><h4>WebExpress.WebUI</h4></div></div>")]
        public void Title(string title, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelMedia()
            {
                Title = title
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the image property of the media control panel.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""media""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData("image.jpg", @"<div class=""media""><img src=""image.jpg"" class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        public void Image(string image, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelMedia()
            {
                Image = image
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the image width property of the media control panel.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""media""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData(100u, @"<div class=""media""><img class=""me-3 mt-3 "" width=""100""><div class=""media-body""></div></div>")]
        public void ImageWidth(uint? imageWidth, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelMedia()
            {
                ImageWidth = imageWidth
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the image height property of the media control panel.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""media""><img class=""me-3 mt-3 ""><div class=""media-body""></div></div>")]
        [InlineData(100u, @"<div class=""media""><img class=""me-3 mt-3 "" height=""100""><div class=""media-body""></div></div>")]
        public void ImageHeight(uint? imageHeight, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelMedia()
            {
                ImageHeight = imageHeight
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the theme property of the panel control.
        /// </summary>
        [Theory]
        [InlineData(TypeTheme.None, @"<div class=""media"">*</div>")]
        [InlineData(TypeTheme.Light, @"<div class=""media"" data-bs-theme=""light"">*</div>")]
        [InlineData(TypeTheme.Dark, @"<div class=""media"" data-bs-theme=""dark"">*</div>")]
        public void Theme(TypeTheme theme, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelMedia()
            {
                Theme = theme
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the media control panel.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlText), @"<div class=""media""><img class=""me-3 mt-3 ""><div class=""media-body""><div></div></div></div>")]
        [InlineData(typeof(ControlLink), @"<div class=""media""><img class=""me-3 mt-3 ""><div class=""media-body""><a class=""wx-link""></a></div></div>")]
        [InlineData(typeof(ControlImage), @"<div class=""media""><img class=""me-3 mt-3 ""><div class=""media-body""><img></div></div>")]
        public void Add(Type child, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var childInstance = Activator.CreateInstance(child, [null]) as IControl;
            var control = new ControlPanelMedia();

            // test execution
            control.Add(childInstance);

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
