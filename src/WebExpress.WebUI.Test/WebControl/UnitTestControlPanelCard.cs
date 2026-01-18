using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the panel card control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPanelCard
    {
        /// <summary>
        /// Tests the id property of the panel card control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""card border""><div class=""card-body""><div class=""card-text""></div></div></div>")]
        [InlineData("id", @"<div id=""id"" class=""card border""><div class=""card-body""><div class=""card-text""></div></div></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header property of the panel card control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""card border""><div class=""card-body""><div class=""card-text""></div></div></div>")]
        [InlineData("header", @"<div class=""card border""><div class=""card-header"">header</div>*</div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""card border""><div class=""card-header"">WebExpress.WebUI</div><div class=""card-body"">*</div></div>")]
        public void Header(string header, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                Header = header
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header image property of the panel card control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""card border""><div class=""card-body""><div class=""card-text""></div></div></div>")]
        [InlineData("/headerImage", @"<div class=""card border""><img src=""/headerImage"" class=""card-img-top"">*</div>")]
        public void HeaderImage(string headerImage, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                HeaderImage = headerImage is not null ? new UriEndpoint(headerImage) : null
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the headline property of the panel card control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""card border""><div class=""card-body""><div class=""card-text""></div></div></div>")]
        [InlineData("headline", @"<div class=""card border"">*<h4 class=""card-title"">headline</h4>*</div>")]
        public void Headline(string headline, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                Headline = headline
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the footer property of the panel card control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""card border""><div class=""card-body""><div class=""card-text""></div></div></div>")]
        [InlineData("footer", @"<div class=""card border"">*<div class=""card-footer"">footer</div></div>")]
        public void Footer(string footer, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                Footer = footer
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the footer image property of the panel card control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""card border""><div class=""card-body""><div class=""card-text""></div></div></div>")]
        [InlineData("/footerImage", @"<div class=""card border"">*<img src=""/footerImage"" class=""card-img-top""></div>")]
        public void FooterImage(string footerImage, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                FooterImage = footerImage is not null ? new UriEndpoint(footerImage) : null
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the theme property of the panel control.
        /// </summary>
        [Theory]
        [InlineData(TypeTheme.None, @"<div class=""card border"">*</div>")]
        [InlineData(TypeTheme.Light, @"<div class=""card border"" data-bs-theme=""light"">*</div>")]
        [InlineData(TypeTheme.Dark, @"<div class=""card border"" data-bs-theme=""dark"">*</div>")]
        public void Theme(TypeTheme theme, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                Theme = theme
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
