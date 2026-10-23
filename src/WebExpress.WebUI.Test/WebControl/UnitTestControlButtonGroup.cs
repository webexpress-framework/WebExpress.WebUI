using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the button group control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlButtonGroup
    {
        /// <summary>
        /// Tests the id property of the button group control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""btn-group"" role=""group""></div>")]
        [InlineData("id", @"<div id=""id"" class=""btn-group"" role=""group""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonGroup(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the vertical property of the button group control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""btn-group"" role=""group""></div>")]
        [InlineData(true, @"<div class=""btn-group-vertical"" role=""group""></div>")]
        public void Vertical(bool vertical, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonGroup()
            {
                Vertical = _ => vertical
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the button group control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeButton.Default, @"<div class=""btn-group"" role=""group""></div>")]
        [InlineData(TypeSizeButton.Small, @"<div class=""btn-group btn-group-sm"" role=""group""></div>")]
        [InlineData(TypeSizeButton.Large, @"<div class=""btn-group btn-group-lg"" role=""group""></div>")]
        public void Size(TypeSizeButton size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonGroup()
            {
                Size = _ => size
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the buttons of the group are rendered inside it.
        /// </summary>
        [Fact]
        public void Items()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonGroup
            (
                null,
                new ControlButton() { Text = _ => "A" },
                new ControlButton() { Text = _ => "B" }
            );

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""btn-group"" role=""group""><button*>A</button><button*>B</button></div>", html);
        }
    }
}
