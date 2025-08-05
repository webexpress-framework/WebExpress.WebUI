using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form item input radio control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputRadio
    {
        /// <summary>
        /// Tests the id property of the form item input radio control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""form-check""><input type=""radio"" class=""form-check-input""><label class=""form-check-label""></label></div>")]
        [InlineData("id", @"<div id=""id"" class=""form-check""><input name=""id"" type=""radio"" class=""form-check-input""><label class=""form-check-label"" for=""id""></label></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRadio(id)
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
        [InlineData(@"<div id=""*"" class=""form-check""><input name=""*"" type=""radio"" class=""form-check-input""><label class=""form-check-label"" for=""*""></label></div>")]
        public void AutoId(string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRadio()
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Inline property of the form item input radio control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""form-check""><input type=""radio"" class=""form-check-input""><label class=""form-check-label""></label></div>")]
        [InlineData(true, @"<div class=""form-check form-check-inline""><input type=""radio"" class=""form-check-input""><label class=""form-check-label""></label></div>")]
        public void Inline(bool inline, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRadio(null)
            {
                Inline = inline
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Description property of the form item input radio control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""form-check""><input type=""radio"" class=""form-check-input""><label class=""form-check-label""></label></div>")]
        [InlineData("description", @"<div class=""form-check""><input type=""radio"" class=""form-check-input""><label class=""form-check-label"">description</label></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""form-check""><input type=""radio"" class=""form-check-input""><label class=""form-check-label"">WebExpress.WebUI</label></div>")]
        public void Description(string description, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRadio(null)
            {
                Description = description
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Description property of the form item input radio control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""form-check""><input type=""radio"" class=""form-check-input""><label class=""form-check-label""></label></div>")]
        [InlineData("option", @"<div class=""form-check""><input type=""radio"" value=""option"" class=""form-check-input""><label class=""form-check-label""></label></div>")]
        public void Option(string option, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRadio(null)
            {
                Option = option
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value method of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div class=""form-check""><input type=""radio"" value=""option"" class=""form-check-input""><label class=""form-check-label""></label></div>*")]
        [InlineData(false, @"*<div class=""form-check""><input type=""radio"" value=""option"" class=""form-check-input""><label class=""form-check-label""></label></div>*")]
        [InlineData(true, @"*<div class=""form-check""><input type=""radio"" value=""option"" class=""form-check-input"" checked><label class=""form-check-label""></label></div>*")]
        public void ValueForm(bool? value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRadio(null)
            {
                Option = "option"
            };
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueString(value?.ToString() == "True"
                    ? "option"
                    : null));
            });

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value method of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div class=""form-check""><input type=""radio"" value=""option"" class=""form-check-input""><label class=""form-check-label""></label></div>*")]
        [InlineData(false, @"*<div class=""form-check""><input type=""radio"" value=""option"" class=""form-check-input""><label class=""form-check-label""></label></div>*")]
        [InlineData(true, @"*<div class=""form-check""><input type=""radio"" value=""option"" class=""form-check-input"" checked><label class=""form-check-label""></label></div>*")]
        public void ValueItem(bool? value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRadio(null)
            {
                Option = "option"
            }.Initialize(args =>
            {
                args.Value.Text = value?.ToString() == "True" ? "option" : null;
            });
            var form = new ControlForm().Add(control);

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
