using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the avatar control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlAvatar
    {
        /// <summary>
        /// Tests the id property of the avatar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-profile""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-profile""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatar(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the user property of the avatar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-profile""></div>")]
        [InlineData("me", @"<div class=""wx-profile""><b class=""bg-info text-light"">m</b>me</div>")]
        public void User(string user, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatar()
            {
                User = user
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the image property of the avatar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-profile""></div>")]
        [InlineData("http://example.com", @"<div class=""wx-profile""><img src=""http://example.com/""></div>")]
        public void Image(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatar()
            {
                Image = uri != null ? new UriEndpoint(uri) : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text color property of the avatar control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div class=""wx-profile""></div>")]
        [InlineData(TypeColorText.Primary, @"<div class=""wx-profile text-primary""></div>")]
        [InlineData(TypeColorText.Secondary, @"<div class=""wx-profile text-secondary""></div>")]
        [InlineData(TypeColorText.Info, @"<div class=""wx-profile text-info""></div>")]
        [InlineData(TypeColorText.Success, @"<div class=""wx-profile text-success""></div>")]
        [InlineData(TypeColorText.Warning, @"<div class=""wx-profile text-warning""></div>")]
        [InlineData(TypeColorText.Danger, @"<div class=""wx-profile text-danger""></div>")]
        [InlineData(TypeColorText.Light, @"<div class=""wx-profile text-light""></div>")]
        [InlineData(TypeColorText.Dark, @"<div class=""wx-profile text-dark""></div>")]
        [InlineData(TypeColorText.Muted, @"<div class=""wx-profile text-muted""></div>")]
        public void TextColor(TypeColorText color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatar()
            {
                TextColor = new PropertyColorText(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the avatar control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<div class=""wx-profile""></div>")]
        [InlineData(TypeColorBackground.Primary, @"<div class=""wx-profile bg-primary""></div>")]
        [InlineData(TypeColorBackground.Secondary, @"<div class=""wx-profile bg-secondary""></div>")]
        [InlineData(TypeColorBackground.Warning, @"<div class=""wx-profile bg-warning""></div>")]
        [InlineData(TypeColorBackground.Danger, @"<div class=""wx-profile bg-danger""></div>")]
        [InlineData(TypeColorBackground.Dark, @"<div class=""wx-profile bg-dark""></div>")]
        [InlineData(TypeColorBackground.Light, @"<div class=""wx-profile bg-light""></div>")]
        [InlineData(TypeColorBackground.Transparent, @"<div class=""wx-profile bg-transparent""></div>")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatar()
            {
                BackgroundColor = new PropertyColorBackground(backgroundColor)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-profile""></div>")]
        [InlineData("http://example.com", @"<div class=""wx-profile""><a href=""http://example.com/"" class=""wx-link""></a></div>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatar()
            {
                Uri = uri != null ? new UriEndpoint(uri) : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the avatar control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeAvatar.Default, @"<div class=""wx-profile""></div>")]
        [InlineData(TypeSizeAvatar.Small, @"<div class=""wx-profile wx-prifile-sm""></div>")]
        [InlineData(TypeSizeAvatar.Large, @"<div class=""wx-profile wx-prifile-lg""></div>")]
        public void Size(TypeSizeAvatar size, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatar()
            {
                Size = size
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
