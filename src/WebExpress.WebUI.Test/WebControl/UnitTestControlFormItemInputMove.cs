using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form move control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputMove
    {
        /// <summary>
        /// Tests the id property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div id=""selection-move-*""></div>")]
        [InlineData("id", @"<div id=""selection-move-id""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div id=""selection-move-*""></div>")]
        [InlineData("abc", @"<div id=""selection-move-*""></div>")]
        public void Name(string name, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove()
            {
                Name = name
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div id=""selection-move-*""></div>*")]
        [InlineData("abc", @"*<div id=""selection-move-*""></div>*")]
        public void Value(string value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove();
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, value);
            });

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Add method of the form move control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove()
            {
            };

            // test execution
            control.Add(new ControlFormItemInputSelectionItem() { Label = "label" });
            var html = control.Render(context, visualTree);

            Assert.NotEmpty(control.Options);
            AssertExtensions.EqualWithPlaceholders(@"<div id=""selection-move-*""></div>", html);
        }
    }
}
