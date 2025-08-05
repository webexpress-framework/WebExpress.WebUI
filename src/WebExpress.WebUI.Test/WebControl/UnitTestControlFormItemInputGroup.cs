using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form group control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputGroup
    {
        /// <summary>
        /// Tests the id property of the form label control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-form-group-column""></div>")]
        [InlineData("id", @"<div class=""wx-form-group-column""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputGroup(id, new ControlFormItemGroupColumnVertical())
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form group control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-form-group-column""></div>")]
        [InlineData("abc", @"<div class=""wx-form-group-column""></div>")]
        public void Name(string name, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputGroup(null, new ControlFormItemGroupColumnVertical())
            {
                Name = name
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the form group control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div class=""wx-form-group-column""></div>*")]
        [InlineData("abc", @"*<div class=""wx-form-group-column""></div>*")]
        public void Value(string value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputGroup(null, new ControlFormItemGroupColumnVertical());
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueString(value));
            });

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
