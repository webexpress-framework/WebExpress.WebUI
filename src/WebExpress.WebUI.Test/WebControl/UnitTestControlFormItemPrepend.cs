using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form item prepend control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemPrepend
    {
        /// <summary>
        /// Tests the id property of the form item prepend control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""input-group-prepend""></div>")]
        [InlineData("id", @"<div id=""id"" class=""input-group-prepend""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemPrepend(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the direction property of the form item prepend control.
        /// </summary>
        [Theory]
        [InlineData(TypeDirection.Default, @"<div class=""input-group-prepend""></div>")]
        [InlineData(TypeDirection.Vertical, @"<div class=""input-group-prepend flex-column""></div>")]
        [InlineData(TypeDirection.VerticalReverse, @"<div class=""input-group-prepend flex-column-reverse""></div>")]
        [InlineData(TypeDirection.Horizontal, @"<div class=""input-group-prepend flex-row""></div>")]
        [InlineData(TypeDirection.HorizontalReverse, @"<div class=""input-group-prepend flex-row-reverse""></div>")]
        public void Direction(TypeDirection direction, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemPrepend()
            {
                Direction = direction,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the fluid property of the form item prepend control.
        /// </summary>
        [Theory]
        [InlineData(TypePanelContainer.None, @"<div class=""input-group-prepend""></div>")]
        [InlineData(TypePanelContainer.Default, @"<div class=""input-group-prepend container""></div>")]
        [InlineData(TypePanelContainer.Fluid, @"<div class=""input-group-prepend container-fluid""></div>")]
        public void Fluid(TypePanelContainer fluid, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemPrepend()
            {
                Fluid = fluid,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the form item prepend control.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlText), @"<div class=""input-group-prepend""><div></div></div>")]
        [InlineData(typeof(ControlLink), @"<div class=""input-group-prepend""><a class=""wx-link""></a></div>")]
        [InlineData(typeof(ControlImage), @"<div class=""input-group-prepend""><img></div>")]
        public void Add(Type child, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var childInstance = Activator.CreateInstance(child, [null]) as IControl;
            var control = new ControlFormItemPrepend();

            // test execution
            control.Add(childInstance);

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
