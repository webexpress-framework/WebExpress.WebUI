using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the panel callout control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPanelCallout
    {
        /// <summary>
        /// Tests the id property of the panel callout control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-callout""><div class=""wx-callout-body""></div></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-callout""><div class=""wx-callout-body""></div></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCallout(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the direction property of the panel callout control.
        /// </summary>
        [Theory]
        [InlineData(TypeDirection.Default, @"<div class=""wx-callout""><div class=""wx-callout-body""></div></div>")]
        [InlineData(TypeDirection.Vertical, @"<div class=""wx-callout flex-column""><div class=""wx-callout-body""></div></div>")]
        [InlineData(TypeDirection.VerticalReverse, @"<div class=""wx-callout flex-column-reverse""><div class=""wx-callout-body""></div></div>")]
        [InlineData(TypeDirection.Horizontal, @"<div class=""wx-callout flex-row""><div class=""wx-callout-body""></div></div>")]
        [InlineData(TypeDirection.HorizontalReverse, @"<div class=""wx-callout flex-row-reverse""><div class=""wx-callout-body""></div></div>")]
        public void Direction(TypeDirection direction, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCallout()
            {
                Direction = direction,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the fluid property of the panel callout control.
        /// </summary>
        [Theory]
        [InlineData(TypePanelContainer.None, @"<div class=""wx-callout""><div class=""wx-callout-body""></div></div>")]
        [InlineData(TypePanelContainer.Default, @"<div class=""wx-callout container""><div class=""wx-callout-body""></div></div>")]
        [InlineData(TypePanelContainer.Fluid, @"<div class=""wx-callout container-fluid""><div class=""wx-callout-body""></div></div>")]
        public void Fluid(TypePanelContainer fluid, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCallout()
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
        [InlineData(TypeTheme.None, @"<div class=""wx-callout"">*</div>")]
        [InlineData(TypeTheme.Light, @"<div class=""wx-callout"" data-bs-theme=""light"">*</div>")]
        [InlineData(TypeTheme.Dark, @"<div class=""wx-callout"" data-bs-theme=""dark"">*</div>")]
        public void Theme(TypeTheme theme, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelCallout()
            {
                Theme = theme
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the panel callout control.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlText), @"<div class=""wx-callout""><div class=""wx-callout-body""><div></div></div></div>")]
        [InlineData(typeof(ControlLink), @"<div class=""wx-callout""><div class=""wx-callout-body""><a class=""wx-link""></a></div></div>")]
        [InlineData(typeof(ControlImage), @"<div class=""wx-callout""><div class=""wx-callout-body""><img></div></div>")]
        public void Add(Type child, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var childInstance = Activator.CreateInstance(child, [null]) as IControl;
            var control = new ControlPanelCallout();

            // act
            control.Add(childInstance);

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
