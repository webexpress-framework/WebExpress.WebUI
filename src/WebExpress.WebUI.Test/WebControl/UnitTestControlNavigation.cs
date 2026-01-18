using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the navigation control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlNavigation
    {
        /// <summary>
        /// Tests the id property of the navigation control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<ul class=""nav""></ul>")]
        [InlineData("id", @"<ul id=""id"" class=""nav""></ul>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigation(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the navigation control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<ul class=""nav""></ul>")]
        [InlineData(TypeColorBackground.Primary, @"<ul class=""nav bg-primary""></ul>")]
        [InlineData(TypeColorBackground.Secondary, @"<ul class=""nav bg-secondary""></ul>")]
        [InlineData(TypeColorBackground.Warning, @"<ul class=""nav bg-warning""></ul>")]
        [InlineData(TypeColorBackground.Danger, @"<ul class=""nav bg-danger""></ul>")]
        [InlineData(TypeColorBackground.Dark, @"<ul class=""nav bg-dark""></ul>")]
        [InlineData(TypeColorBackground.Light, @"<ul class=""nav bg-light""></ul>")]
        [InlineData(TypeColorBackground.Transparent, @"<ul class=""nav bg-transparent""></ul>")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigation()
            {
                BackgroundColor = new PropertyColorBackground(backgroundColor)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the layout property of the navigation control.
        /// </summary>
        [Theory]
        [InlineData(TypeLayoutTab.Default, @"<ul class=""nav""></ul>")]
        [InlineData(TypeLayoutTab.Menu, @"<ul class=""nav""></ul>")]
        [InlineData(TypeLayoutTab.Tab, @"<ul class=""nav nav-tabs""></ul>")]
        [InlineData(TypeLayoutTab.Pill, @"<ul class=""nav nav-pills""></ul>")]
        public void Layout(TypeLayoutTab layout, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigation()
            {
                Layout = layout
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the navigation control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigation();

            // act
            control.Add(new ControlNavigationItemLink() { Text = "abc" });

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<ul class=""nav""><li class=""nav-item""><a class=""wx-link nav-link"">abc</a></li></ul>", html);
        }
    }
}
