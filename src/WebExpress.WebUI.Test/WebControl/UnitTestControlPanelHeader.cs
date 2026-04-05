using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the panel header control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPanelHeader
    {
        /// <summary>
        /// Tests the id property of the panel header control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<header></header>")]
        [InlineData("id", @"<header id=""id""></header>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelHeader(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the direction property of the panel header control.
        /// </summary>
        [Theory]
        [InlineData(TypeDirection.Default, @"<header></header>")]
        [InlineData(TypeDirection.Vertical, @"<header class=""flex-column""></header>")]
        [InlineData(TypeDirection.VerticalReverse, @"<header class=""flex-column-reverse""></header>")]
        [InlineData(TypeDirection.Horizontal, @"<header class=""flex-row""></header>")]
        [InlineData(TypeDirection.HorizontalReverse, @"<header class=""flex-row-reverse""></header>")]
        public void Direction(TypeDirection direction, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelHeader()
            {
                Direction = direction,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the fluid property of the panel header control.
        /// </summary>
        [Theory]
        [InlineData(TypePanelContainer.None, @"<header></header>")]
        [InlineData(TypePanelContainer.Default, @"<header class=""container""></header>")]
        [InlineData(TypePanelContainer.Fluid, @"<header class=""container-fluid""></header>")]
        public void Fluid(TypePanelContainer fluid, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelHeader()
            {
                Fluid = fluid,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the fixed property of the panel header control.
        /// </summary>
        [Theory]
        [InlineData(TypeFixed.None, @"<header></header>")]
        [InlineData(TypeFixed.Top, @"<header class=""fixed-top""></header>")]
        [InlineData(TypeFixed.Bottom, @"<header class=""fixed-bottom""></header>")]
        public void Fixed(TypeFixed fixedValue, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelHeader()
            {
                Fixed = fixedValue
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the sticky property of the panel header control.
        /// </summary>
        [Theory]
        [InlineData(TypeSticky.None, @"<header></header>")]
        [InlineData(TypeSticky.Top, @"<header class=""sticky-top""></header>")]
        public void Sticky(TypeSticky sticky, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelHeader()
            {
                Sticky = sticky,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the theme property of the panel control.
        /// </summary>
        [Theory]
        [InlineData(TypeTheme.None, @"<header></header>")]
        [InlineData(TypeTheme.Light, @"<header data-bs-theme=""light""></header>")]
        [InlineData(TypeTheme.Dark, @"<header data-bs-theme=""dark""></header>")]
        public void Theme(TypeTheme theme, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelHeader()
            {
                Theme = theme
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the panel header control.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlText), @"<header><div></div></header>")]
        [InlineData(typeof(ControlLink), @"<header><a class=""wx-link""></a></header>")]
        [InlineData(typeof(ControlImage), @"<header><img></header>")]
        public void Add(Type child, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var childInstance = Activator.CreateInstance(child, [null]) as IControl;
            var control = new ControlPanelHeader();

            // act
            control.Add(childInstance);

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
