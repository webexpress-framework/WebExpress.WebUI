using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the tile control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTile
    {
        /// <summary>
        /// Tests the id property of the tile control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-tile""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-tile""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTile(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the movable property of the tile control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-tile""></div>")]
        [InlineData(true, @"<div class=""wx-webui-tile"" data-movable=""true""></div>")]
        public void Movable(bool movable, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTile(null)
            {
                Movable = movable
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the allow remove property of the tile control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-tile""></div>")]
        [InlineData(true, @"<div class=""wx-webui-tile"" data-allow-remove=""true""></div>")]
        public void AllowRemove(bool allowRemove, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTile(null)
            {
                AllowRemove = allowRemove
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a item to the tile control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTile(null);

            // add column
            control.Add(new ControlTileCard());

            // act
            var html = control.Render(context, visualTree);

            // expected HTML
            var expected = @"<div class=""wx-webui-tile""><div class=""wx-tile-card""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

    }
}
