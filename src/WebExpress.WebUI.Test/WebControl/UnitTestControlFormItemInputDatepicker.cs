using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form datepicker control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputDatepicker
    {
        /// <summary>
        /// Tests the id property of the form datepicker control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input id=""datepicker"" name=""datepicker"" type=""text"" class=""form-control"">")]
        [InlineData("id", @"<input id=""id"" name=""id"" type=""text"" class=""form-control"">")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputDatepicker(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form datepicker control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input id=""datepicker"" type=""text"" class=""form-control"">")]
        [InlineData("abc", @"<input id=""datepicker"" name=""abc"" type=""text"" class=""form-control"">")]
        public void Name(string name, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputDatepicker()
            {
                Name = name
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the form datepicker control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<input id=""datepicker"" name=""datepicker"" type=""text"" class=""form-control"">*")]
        [InlineData("2023-10-10", @"*<input id=""datepicker"" name=""datepicker"" type=""text"" class=""form-control"" value=""2023-10-10"">*")]
        public void Value(string value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputDatepicker();
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, value);
            });

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the required property of the form datepicker control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<input id=""datepicker"" name=""datepicker"" type=""text"" class=""form-control"">")]
        [InlineData(true, @"<input id=""datepicker"" name=""datepicker"" type=""text"" class=""form-control"">")]
        public void Required(bool required, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputDatepicker()
            {
                Required = required
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
