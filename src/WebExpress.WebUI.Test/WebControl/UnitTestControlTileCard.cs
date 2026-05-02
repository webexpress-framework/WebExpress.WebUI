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
        /// Tests the id property of the tile card control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tile-card""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-tile-card""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTileCard(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the tile card control.
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
        [InlineData(TypeColorTile.Highlight, @"<div class=""wx-tile-card"" data-color-css=""wx-tile-highlight""></div>")]
        public void Color(TypeColorTile color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTileCard()
            {
                Color = new PropertyColorTile(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header property of the tile card control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tile-card""></div>")]
        [InlineData("header", @"<div class=""wx-tile-card"" data-label=""header""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-tile-card"" data-label=""WebExpress.WebUI""></div>")]
        public void Header(string header, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTileCard()
            {
                Header = header
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the tile card control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tile-card""></div>")]
        [InlineData(typeof(IconFolder), @"<div class=""wx-tile-card"" data-icon=""fas fa-folder""></div>")]
        public void Icon(Type iconType, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var icon = iconType is not null ? Activator.CreateInstance(iconType) as IIcon : null;
            var control = new ControlTileCard(null)
            {
                Icon = icon
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the primary action property of the tile card control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tile-card""></div>")]
        [InlineData("modal", @"<div class=""wx-tile-card"" data-wx-primary-action=""modal"" data-wx-primary-target=""#modal""></div>")]
        public void PrimaryAction(string modal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTileCard()
            {
                PrimaryAction = new ActionModal(modal)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the secondary action property of the tile card control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tile-card""></div>")]
        [InlineData("modal", @"<div class=""wx-tile-card"" data-wx-secondary-action=""modal"" data-wx-secondary-target=""#modal""></div>")]
        public void SecondaryAction(string modal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTileCard()
            {
                SecondaryAction = new ActionModal(modal)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a item to the tile card control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTileCard(null);

            // act
            control.Add(new ControlText());

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-tile-card""><div></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

    }
}
