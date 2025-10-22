using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the panel main control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPanelMain
    {
        /// <summary>
        /// Tests the id property of the panel main control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<main></main>")]
        [InlineData("id", @"<main id=""id""></main>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelMain(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the direction property of the panel main control.
        /// </summary>
        [Theory]
        [InlineData(TypeDirection.Default, @"<main></main>")]
        [InlineData(TypeDirection.Vertical, @"<main class=""flex-column""></main>")]
        [InlineData(TypeDirection.VerticalReverse, @"<main class=""flex-column-reverse""></main>")]
        [InlineData(TypeDirection.Horizontal, @"<main class=""flex-row""></main>")]
        [InlineData(TypeDirection.HorizontalReverse, @"<main class=""flex-row-reverse""></main>")]
        public void Direction(TypeDirection direction, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelMain()
            {
                Direction = direction,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the fluid property of the panel main control.
        /// </summary>
        [Theory]
        [InlineData(TypePanelContainer.None, @"<main></main>")]
        [InlineData(TypePanelContainer.Default, @"<main class=""container""></main>")]
        [InlineData(TypePanelContainer.Fluid, @"<main class=""container-fluid""></main>")]
        public void Fluid(TypePanelContainer fluid, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelMain()
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
        [InlineData(TypeTheme.None, @"<main></main>")]
        [InlineData(TypeTheme.Light, @"<main data-bs-theme=""light""></main>")]
        [InlineData(TypeTheme.Dark, @"<main data-bs-theme=""dark""></main>")]
        public void Theme(TypeTheme theme, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelMain()
            {
                Theme = theme
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the panel main control.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlText), @"<main><div></div></main>")]
        [InlineData(typeof(ControlLink), @"<main><a class=""wx-link""></a></main>")]
        [InlineData(typeof(ControlImage), @"<main><img></main>")]
        public void Add(Type child, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var childInstance = Activator.CreateInstance(child, [null]) as IControl;
            var control = new ControlPanelMain();

            // test execution
            control.Add(childInstance);

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
