using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form label control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemLabel
    {
        /// <summary>
        /// Tests the id property of the form label control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<label class=""wx-form-label""></label>")]
        [InlineData("id", @"<label id=""id"" class=""wx-form-label""></label>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemLabel(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form label control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<label class=""wx-form-label""></label>")]
        [InlineData("abc", @"<label class=""wx-form-label""></label>")]
        public void Name(string name, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemLabel()
            {
                Name = name
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the form label control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<label class=""wx-form-label""></label>")]
        [InlineData("abc", @"<label class=""wx-form-label"">abc</label>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemLabel()
            {
                Text = text
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the form item property of the form label control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<label class=""wx-form-label""></label>")]
        [InlineData(true, @"<label class=""wx-form-label"" for=""*""></label>")]
        public void FormItem(bool formItem, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemLabel(null)
            {
                FormItem = formItem ? new ControlFormItemInputText() : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
