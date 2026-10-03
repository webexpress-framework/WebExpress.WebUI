using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the panel footer control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFooter
    {
        /// <summary>
        /// Tests the id property of the panel footer control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<footer></footer>")]
        [InlineData("id", @"<footer id=""id""></footer>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFooter(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the direction property of the panel footer control.
        /// </summary>
        [Theory]
        [InlineData(TypeDirection.Default, @"<footer></footer>")]
        [InlineData(TypeDirection.Vertical, @"<footer class=""flex-column""></footer>")]
        [InlineData(TypeDirection.VerticalReverse, @"<footer class=""flex-column-reverse""></footer>")]
        [InlineData(TypeDirection.Horizontal, @"<footer class=""flex-row""></footer>")]
        [InlineData(TypeDirection.HorizontalReverse, @"<footer class=""flex-row-reverse""></footer>")]
        public void Direction(TypeDirection direction, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFooter()
            {
                Direction = _ => direction,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the fluid property of the panel footer control.
        /// </summary>
        [Theory]
        [InlineData(TypePanelContainer.None, @"<footer></footer>")]
        [InlineData(TypePanelContainer.Default, @"<footer class=""container""></footer>")]
        [InlineData(TypePanelContainer.Fluid, @"<footer class=""container-fluid""></footer>")]
        public void Fluid(TypePanelContainer fluid, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFooter()
            {
                Fluid = _ => fluid,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the theme property of the panel control.
        /// </summary>
        [Theory]
        [InlineData(TypeTheme.None, @"<footer></footer>")]
        [InlineData(TypeTheme.Light, @"<footer data-wx-theme=""light""></footer>")]
        [InlineData(TypeTheme.Dark, @"<footer data-wx-theme=""dark""></footer>")]
        public void Theme(TypeTheme theme, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFooter()
            {
                Theme = _ => theme
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the panel footer control.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlText), @"<footer><div></div></footer>")]
        [InlineData(typeof(ControlLink), @"<footer><a class=""wx-link""></a></footer>")]
        [InlineData(typeof(ControlImage), @"<footer><img alt></footer>")]
        public void Add(Type child, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var childInstance = Activator.CreateInstance(child, [null]) as IControl;
            var control = new ControlFooter();

            // act
            control.Add(childInstance);

            // validation
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
