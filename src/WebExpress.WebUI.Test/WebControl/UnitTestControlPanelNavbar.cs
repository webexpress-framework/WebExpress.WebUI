using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the navbar control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPanelNavbar
    {
        /// <summary>
        /// Tests the id property of the navbar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<nav class=""navbar""></nav>")]
        [InlineData("id", @"<nav id=""id"" class=""navbar""></nav>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelNavbar(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the navbar control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<nav class=""navbar""></nav>")]
        [InlineData(TypeColorBackground.Primary, @"<nav class=""navbar bg-primary""></nav>")]
        [InlineData(TypeColorBackground.Secondary, @"<nav class=""navbar bg-secondary""></nav>")]
        [InlineData(TypeColorBackground.Warning, @"<nav class=""navbar bg-warning""></nav>")]
        [InlineData(TypeColorBackground.Danger, @"<nav class=""navbar bg-danger""></nav>")]
        [InlineData(TypeColorBackground.Dark, @"<nav class=""navbar bg-dark""></nav>")]
        [InlineData(TypeColorBackground.Light, @"<nav class=""navbar bg-light""></nav>")]
        [InlineData(TypeColorBackground.Highlight, @"<nav class=""navbar bg-highlight""></nav>")]
        [InlineData(TypeColorBackground.Transparent, @"<nav class=""navbar bg-transparent""></nav>")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelNavbar()
            {
                BackgroundColor = new PropertyColorBackground(backgroundColor)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the direction property of the navbar control.
        /// </summary>
        [Theory]
        [InlineData(TypeDirection.Default, @"<nav class=""navbar""></nav>")]
        [InlineData(TypeDirection.Vertical, @"<nav class=""navbar flex-column""></nav>")]
        [InlineData(TypeDirection.VerticalReverse, @"<nav class=""navbar flex-column-reverse""></nav>")]
        [InlineData(TypeDirection.Horizontal, @"<nav class=""navbar flex-row""></nav>")]
        [InlineData(TypeDirection.HorizontalReverse, @"<nav class=""navbar flex-row-reverse""></nav>")]
        public void Direction(TypeDirection direction, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelNavbar()
            {
                Direction = direction,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the fluid property of the navbar control.
        /// </summary>
        [Theory]
        [InlineData(TypePanelContainer.None, @"<nav class=""navbar""></nav>")]
        [InlineData(TypePanelContainer.Default, @"<nav class=""navbar container""></nav>")]
        [InlineData(TypePanelContainer.Fluid, @"<nav class=""navbar container-fluid""></nav>")]
        public void Fluid(TypePanelContainer fluid, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelNavbar()
            {
                Fluid = fluid,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the theme property of the panel control.
        /// </summary>
        [Theory]
        [InlineData(TypeTheme.None, @"<nav class=""navbar"">*</nav>")]
        [InlineData(TypeTheme.Light, @"<nav class=""navbar"" data-bs-theme=""light"">*</nav>")]
        [InlineData(TypeTheme.Dark, @"<nav class=""navbar"" data-bs-theme=""dark"">*</nav>")]
        public void Theme(TypeTheme theme, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelNavbar()
            {
                Theme = theme
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the navbar control.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlText), @"<nav class=""navbar""><div></div></nav>")]
        [InlineData(typeof(ControlLink), @"<nav class=""navbar""><a class=""wx-link""></a></nav>")]
        [InlineData(typeof(ControlImage), @"<nav class=""navbar""><img></nav>")]
        public void Add(Type child, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var childInstance = Activator.CreateInstance(child, [null]) as IControl;
            var control = new ControlPanelNavbar();

            // act
            control.Add(childInstance);

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
