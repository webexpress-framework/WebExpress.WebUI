using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the tile card control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTileCard
    {
        /// <summary>
        /// Tests the id property of the tile control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tile-card""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-tile-card""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTileCard(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the alert control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorTile.Default, @"<div class=""wx-tile-card""></div>")]
        [InlineData(TypeColorTile.Primary, @"<div class=""wx-tile-card"" data-color-css=""wx-tile-primary""></div>")]
        [InlineData(TypeColorTile.Secondary, @"<div class=""wx-tile-card"" data-color-css=""wx-tile-secondary""></div>")]
        [InlineData(TypeColorTile.Info, @"<div class=""wx-tile-card"" data-color-css=""wx-tile-info""></div>")]
        [InlineData(TypeColorTile.Warning, @"<div class=""wx-tile-card"" data-color-css=""wx-tile-warning""></div>")]
        [InlineData(TypeColorTile.Danger, @"<div class=""wx-tile-card"" data-color-css=""wx-tile-danger""></div>")]
        [InlineData(TypeColorTile.Dark, @"<div class=""wx-tile-card"" data-color-css=""wx-tile-dark""></div>")]
        [InlineData(TypeColorTile.White, @"<div class=""wx-tile-card"" data-color-css=""wx-tile-white""></div>")]
        [InlineData(TypeColorTile.Transparent, @"<div class=""wx-tile-card"" data-color-css=""wx-tile-transparent""></div>")]
        public void Color(TypeColorTile color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTileCard()
            {
                Color = new PropertyColorTile(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header property of the panel card control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tile-card""></div>")]
        [InlineData("header", @"<div class=""wx-tile-card"" data-label=""header""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-tile-card"" data-label=""WebExpress.WebUI""></div>")]
        public void Header(string header, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTileCard()
            {
                Header = header
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the form tile card control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tile-card""></div>")]
        [InlineData(typeof(IconFolder), @"<div class=""wx-tile-card"" data-icon=""fas fa-folder""></div>")]
        public void Icon(Type iconType, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var icon = iconType != null ? Activator.CreateInstance(iconType) as IIcon : null;
            var control = new ControlTileCard(null)
            {
                Icon = icon
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a item to the tile control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTileCard(null);

            // add column
            control.Add(new ControlText());

            // test execution
            var html = control.Render(context, visualTree);

            // expected HTML
            var expected = @"<div class=""wx-tile-card""><div></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

    }
}
