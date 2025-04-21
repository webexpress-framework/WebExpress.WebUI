using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the panel footer control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPanelFooter
    {
        /// <summary>
        /// Tests the id property of the panel footer control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<footer></footer>")]
        [InlineData("id", @"<footer id=""id""></footer>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelFooter(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

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
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelFooter()
            {
                Direction = direction,
            };

            // test execution
            var html = control.Render(context, visualTree);

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
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelFooter()
            {
                Fluid = fluid,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the theme property of the panel control.
        /// </summary>
        [Theory]
        [InlineData(TypeTheme.None, @"<footer></footer>")]
        [InlineData(TypeTheme.Light, @"<footer data-bs-theme=""light""></footer>")]
        [InlineData(TypeTheme.Dark, @"<footer data-bs-theme=""dark""></footer>")]
        public void Theme(TypeTheme theme, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelFooter()
            {
                Theme = theme
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the panel footer control.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlText), @"<footer><div></div></footer>")]
        [InlineData(typeof(ControlLink), @"<footer><a class=""link""></a></footer>")]
        [InlineData(typeof(ControlImage), @"<footer><img></footer>")]
        public void Add(Type child, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var childInstance = Activator.CreateInstance(child, [null]) as IControl;
            var control = new ControlPanelFooter();

            // test execution
            control.Add(childInstance);

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
