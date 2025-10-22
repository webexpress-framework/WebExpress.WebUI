using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the grid control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPanelGrid
    {
        /// <summary>
        /// Tests the id property of the grid control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div><div class=""row""></div></div>")]
        [InlineData("id", @"<div id=""id""><div class=""row""></div></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelGrid(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the grid control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<div><div class=""row""></div></div>")]
        [InlineData(TypeColorBackground.Primary, @"<div class=""bg-primary""><div class=""row""></div></div>")]
        [InlineData(TypeColorBackground.Secondary, @"<div class=""bg-secondary""><div class=""row""></div></div>")]
        [InlineData(TypeColorBackground.Warning, @"<div class=""bg-warning""><div class=""row""></div></div>")]
        [InlineData(TypeColorBackground.Danger, @"<div class=""bg-danger""><div class=""row""></div></div>")]
        [InlineData(TypeColorBackground.Dark, @"<div class=""bg-dark""><div class=""row""></div></div>")]
        [InlineData(TypeColorBackground.Light, @"<div class=""bg-light""><div class=""row""></div></div>")]
        [InlineData(TypeColorBackground.Transparent, @"<div class=""bg-transparent""><div class=""row""></div></div>")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelGrid()
            {
                BackgroundColor = new PropertyColorBackground(backgroundColor)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the direction property of the grid control.
        /// </summary>
        [Theory]
        [InlineData(TypeDirection.Default, @"<div><div class=""row""></div></div>")]
        [InlineData(TypeDirection.Vertical, @"<div class=""flex-column""><div class=""row""></div></div>")]
        [InlineData(TypeDirection.VerticalReverse, @"<div class=""flex-column-reverse""><div class=""row""></div></div>")]
        [InlineData(TypeDirection.Horizontal, @"<div class=""flex-row""><div class=""row""></div></div>")]
        [InlineData(TypeDirection.HorizontalReverse, @"<div class=""flex-row-reverse""><div class=""row""></div></div>")]
        public void Direction(TypeDirection direction, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelGrid()
            {
                Direction = direction,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the fluid property of the grid control.
        /// </summary>
        [Theory]
        [InlineData(TypePanelContainer.None, @"<div><div class=""row""></div></div>")]
        [InlineData(TypePanelContainer.Default, @"<div class=""container""><div class=""row""></div></div>")]
        [InlineData(TypePanelContainer.Fluid, @"<div class=""container-fluid""><div class=""row""></div></div>")]
        public void Fluid(TypePanelContainer fluid, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelGrid()
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
        [InlineData(TypeTheme.None, @"<div>*</div>")]
        [InlineData(TypeTheme.Light, @"<div data-bs-theme=""light"">*</div>")]
        [InlineData(TypeTheme.Dark, @"<div data-bs-theme=""dark"">*</div>")]
        public void Theme(TypeTheme theme, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelGrid()
            {
                Theme = theme
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the grid control.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlText), @"<div><div class=""row""><div></div></div></div>")]
        [InlineData(typeof(ControlLink), @"<div><div class=""row""><a class=""wx-link""></a></div></div>")]
        [InlineData(typeof(ControlImage), @"<div><div class=""row""><img></div></div>")]
        public void Add(Type child, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var childInstance = Activator.CreateInstance(child, [null]) as IControl;
            var control = new ControlPanelGrid();

            // test execution
            control.Add(childInstance);

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
