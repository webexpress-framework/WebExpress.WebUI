using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the panel card control. The C# side only emits the host element
    /// and the relevant data-* attributes; the actual card-header / card-body
    /// / card-footer structure is built at runtime by
    /// <c>webexpress.webui.PanelCardCtrl</c>.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPanelCard
    {
        /// <summary>
        /// Tests the id property of the panel card control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-card border""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-card border""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header property of the panel card control. The value is
        /// emitted as the <c>data-header</c> attribute on the host element.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-card border""></div>")]
        [InlineData("header", @"<div class=""wx-webui-card border"" data-header=""header""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-card border"" data-header=""WebExpress.WebUI""></div>")]
        public void Header(string header, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                Header = _ => header
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header icon property when the supplied icon is image-based.
        /// The URL must be emitted as <c>data-header-icon-image</c>.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-card border""></div>")]
        [InlineData("/headerImage", @"<div class=""wx-webui-card border"" data-header-icon-image=""/headerImage""></div>")]
        public void HeaderIconImage(string headerImage, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                HeaderIcon = _ => headerImage is not null ? new ImageIcon(new UriEndpoint(headerImage)) : null
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header icon property when the supplied icon is CSS-based.
        /// The CSS class must be emitted as <c>data-header-icon-css</c>.
        /// </summary>
        [Fact]
        public void HeaderIconCss()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                HeaderIcon = _ => new IconHome()
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"class=""wx-webui-card border""", html);
            Assert.Contains(@"data-header-icon-css=""fas fa-home""", html);
            Assert.DoesNotContain("data-header-icon-image", html);
        }

        /// <summary>
        /// Tests the headline property. The value is emitted as the
        /// <c>data-headline</c> attribute on the host element.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-card border""></div>")]
        [InlineData("headline", @"<div class=""wx-webui-card border"" data-headline=""headline""></div>")]
        public void Headline(string headline, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                Headline = _ => headline
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the footer property. The value is emitted as the
        /// <c>data-footer</c> attribute on the host element.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-card border""></div>")]
        [InlineData("footer", @"<div class=""wx-webui-card border"" data-footer=""footer""></div>")]
        public void Footer(string footer, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                Footer = _ => footer
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the footer icon property when the supplied icon is image-based.
        /// The URL must be emitted as <c>data-footer-icon-image</c>.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-card border""></div>")]
        [InlineData("/footerImage", @"<div class=""wx-webui-card border"" data-footer-icon-image=""/footerImage""></div>")]
        public void FooterIconImage(string footerImage, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                FooterIcon = _ => footerImage is not null ? new ImageIcon(new UriEndpoint(footerImage)) : null
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the footer icon property when the supplied icon is CSS-based.
        /// </summary>
        [Fact]
        public void FooterIconCss()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                FooterIcon = _ => new IconHome()
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"class=""wx-webui-card border""", html);
            Assert.Contains(@"data-footer-icon-css=""fas fa-home""", html);
            Assert.DoesNotContain("data-footer-icon-image", html);
        }

        /// <summary>
        /// Tests that arbitrary content controls are rendered as direct
        /// children of the host element so the JavaScript controller can move
        /// them into the body during hydration.
        /// </summary>
        [Fact]
        public void ContentIsRenderedAsDirectChildren()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
                .Add(new ControlText() { Text = _ => "hello" });

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains("hello", html);
            Assert.DoesNotContain("card-body", html);
            Assert.DoesNotContain("card-text", html);
        }

        /// <summary>
        /// Tests that the header background system colour is emitted as
        /// <c>data-header-bg-class</c> on the host element.
        /// </summary>
        [Fact]
        public void HeaderBackgroundColorSystem()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                HeaderBackgroundColor = _ => new PropertyColorBackground(TypeColorBackground.Primary)
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"data-header-bg-class=""bg-primary""", html);
            Assert.DoesNotContain("data-header-bg-style", html);
        }

        /// <summary>
        /// Tests that a user-defined header background colour is emitted as
        /// <c>data-header-bg-style</c>.
        /// </summary>
        [Fact]
        public void HeaderBackgroundColorUser()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                HeaderBackgroundColor = _ => new PropertyColorBackground("gold")
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"data-header-bg-style=""background:gold;""", html);
            Assert.DoesNotContain("data-header-bg-class", html);
        }

        /// <summary>
        /// Tests that the header text colour is emitted as
        /// <c>data-header-color-class</c>.
        /// </summary>
        [Fact]
        public void HeaderTextColorSystem()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                HeaderTextColor = _ => new PropertyColorText(TypeColorText.White)
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"data-header-color-class=""text-white""", html);
        }

        /// <summary>
        /// Tests that the footer background system colour is emitted as
        /// <c>data-footer-bg-class</c> on the host element.
        /// </summary>
        [Fact]
        public void FooterBackgroundColorSystem()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                FooterBackgroundColor = _ => new PropertyColorBackground(TypeColorBackground.Success)
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"data-footer-bg-class=""bg-success""", html);
        }

        /// <summary>
        /// Tests that a user-defined footer background colour is emitted as
        /// <c>data-footer-bg-style</c>.
        /// </summary>
        [Fact]
        public void FooterBackgroundColorUser()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                FooterBackgroundColor = _ => new PropertyColorBackground("#abcdef")
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"data-footer-bg-style=""background:#abcdef;""", html);
        }

        /// <summary>
        /// Tests that the footer text colour is emitted as
        /// <c>data-footer-color-class</c>.
        /// </summary>
        [Fact]
        public void FooterTextColorSystem()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                FooterTextColor = _ => new PropertyColorText(TypeColorText.Muted)
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"data-footer-color-class=""text-muted""", html);
        }

        /// <summary>
        /// Tests that the theme property of the panel control.
        /// </summary>
        [Theory]
        [InlineData(TypeTheme.None, @"<div class=""wx-webui-card border""></div>")]
        [InlineData(TypeTheme.Light, @"<div class=""wx-webui-card border"" data-bs-theme=""light""></div>")]
        [InlineData(TypeTheme.Dark, @"<div class=""wx-webui-card border"" data-bs-theme=""dark""></div>")]
        public void Theme(TypeTheme theme, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCard()
            {
                Theme = _ => theme
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
