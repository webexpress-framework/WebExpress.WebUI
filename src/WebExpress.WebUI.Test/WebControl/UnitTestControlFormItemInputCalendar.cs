using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form calendar control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputCalendar
    {
        /// <summary>
        /// Tests the id property of the form calendar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-calendar"" *></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-input-calendar"" name=""id"" *></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCalendar(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form calendar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-calendar"" *></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-calendar"" name=""abc"" *></div>")]
        public void Name(string name, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCalendar(null)
            {
                Name = name
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the form calendar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div class=""wx-webui-input-calendar"" *></div>*")]
        [InlineData("2023-10-10", @"*<div class=""wx-webui-input-calendar"" data-value=""2023-10-10"" *></div>*")]
        public void Value(string value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCalendar(null)
            {
                Format = "yyyy-MM-dd"
            };
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueDate(value, context.Request.Culture));
            });

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the form calendar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-calendar"" data-format=""*""></div>")]
        [InlineData("select a date", @"<div class=""wx-webui-input-calendar"" placeholder=""select a date"" data-format=""*""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-input-calendar"" placeholder=""WebExpress.WebUI"" data-format=""*""></div>")]
        public void Placeholder(string placeholder, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCalendar(null)
            {
                Placeholder = placeholder
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the format property of the form calendar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-calendar"" data-format=""M/d/yyyy""></div>")]
        [InlineData("yyyy-mm-dd", @"<div class=""wx-webui-input-calendar"" data-format=""yyyy-mm-dd""></div>")]
        public void Format(string format, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCalendar(null)
            {
                Format = format
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the required property of the form calendar control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-input-calendar"" *></div>")]
        [InlineData(true, @"<div class=""wx-webui-input-calendar"" *></div>")]
        public void Required(bool required, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCalendar(null)
            {
                Required = required
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
