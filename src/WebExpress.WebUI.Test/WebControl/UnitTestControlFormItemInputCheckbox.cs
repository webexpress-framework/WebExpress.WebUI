using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form item input checkbox control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputCheckbox
    {
        /// <summary>
        /// Tests the id property of the form item input checkbox control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""checkbox""><label><input type=""checkbox""></label></div>")]
        [InlineData("id", @"<div id=""id"" class=""checkbox""><label><input name=""id"" type=""checkbox""></label></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCheckBox(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form check box control.
        /// </summary>
        [Theory]
        [InlineData(@"<div id=""*"" class=""checkbox""><label><input name=""*"" type=""checkbox""></label></div>")]
        public void AutoId(string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCheckBox()
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Inline property of the form item input checkbox control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""checkbox""><label><input type=""checkbox""></label></div>")]
        [InlineData(true, @"<div class=""checkbox""><label><input type=""checkbox""></label></div>")]
        public void Inline(bool inline, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCheckBox(null)
            {
                Inline = inline
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Description property of the form item input checkbox control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""checkbox""><label><input type=""checkbox""></label></div>")]
        [InlineData("description", @"<div class=""checkbox""><label><input type=""checkbox"">&nbsp;description </label></div>")]
        public void Description(string description, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCheckBox(null)
            {
                Description = description
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Pattern property of the form item input checkbox control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""checkbox""><label><input type=""checkbox""></label></div>")]
        [InlineData("pattern", @"<div class=""checkbox""><label><input pattern=""pattern"" type=""checkbox""></label></div>")]
        public void Pattern(string pattern, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCheckBox(null)
            {
                Pattern = pattern
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value method of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<input type=""checkbox"">*")]
        [InlineData(false, @"*<input type=""checkbox"">*")]
        [InlineData(true, @"*<input type=""checkbox"" checked>*")]
        public void ValueForm(bool? value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCheckBox(null);
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, value?.ToString());
            });

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value method of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<input type=""checkbox"">*")]
        [InlineData(false, @"*<input type=""checkbox"">*")]
        [InlineData(true, @"*<input type=""checkbox"" checked>*")]
        public void ValueItem(bool? value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCheckBox(null).Initialize(args =>
            {
                args.Value = value?.ToString();
            });
            var form = new ControlForm().Add(control);

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
