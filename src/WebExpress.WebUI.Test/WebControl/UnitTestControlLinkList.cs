using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the link list control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlLinkList
    {
        /// <summary>
        /// Tests the id property of the link list control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData("id", @"<div id=""id""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLinkList(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the link list control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData("abc", @"<div><span>abc</span></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div><span>WebExpress.WebUI</span></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLinkList()
            {
                Name = name,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name color property of the link list control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div><span>abc</span></div>")]
        [InlineData(TypeColorText.Primary, @"<div><span class=""text-primary"">abc</span></div>")]
        [InlineData(TypeColorText.Secondary, @"<div><span class=""text-secondary"">abc</span></div>")]
        [InlineData(TypeColorText.Info, @"<div><span class=""text-info"">abc</span></div>")]
        [InlineData(TypeColorText.Success, @"<div><span class=""text-success"">abc</span></div>")]
        [InlineData(TypeColorText.Warning, @"<div><span class=""text-warning"">abc</span></div>")]
        [InlineData(TypeColorText.Danger, @"<div><span class=""text-danger"">abc</span></div>")]
        [InlineData(TypeColorText.Light, @"<div><span class=""text-light"">abc</span></div>")]
        [InlineData(TypeColorText.Dark, @"<div><span class=""text-dark"">abc</span></div>")]
        [InlineData(TypeColorText.Muted, @"<div><span class=""text-muted"">abc</span></div>")]
        public void NameColor(TypeColorText color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLinkList()
            {
                Name = "abc",
                NameColor = new PropertyColorText(color)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the link list control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData(typeof(IconStar), @"<div><i class=""fas fa-star""></i></div>")]
        public void Icon(Type icon, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLinkList()
            {
                Icon = icon is not null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the link list control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<div></div>")]
        [InlineData(TypeColorBackground.Primary, @"<div class=""bg-primary""></div>")]
        [InlineData(TypeColorBackground.Secondary, @"<div class=""bg-secondary""></div>")]
        [InlineData(TypeColorBackground.Info, @"<div class=""bg-info""></div>")]
        [InlineData(TypeColorBackground.Warning, @"<div class=""bg-warning""></div>")]
        [InlineData(TypeColorBackground.Danger, @"<div class=""bg-danger""></div>")]
        [InlineData(TypeColorBackground.Light, @"<div class=""bg-light""></div>")]
        [InlineData(TypeColorBackground.Dark, @"<div class=""bg-dark""></div>")]
        [InlineData(TypeColorBackground.White, @"<div class=""bg-white""></div>")]
        [InlineData(TypeColorBackground.Transparent, @"<div class=""bg-transparent""></div>")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLinkList()
            {
                BackgroundColor = new PropertyColorBackground(backgroundColor)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the link list control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLinkList();

            // act
            control.Add(new ControlLink() { Text = "abc" });

            var html = control.Render(context, visualTree);

            Assert.Equal(@"<div><a class=""wx-link"">abc</a></div>", html.Trim());
        }
    }
}
