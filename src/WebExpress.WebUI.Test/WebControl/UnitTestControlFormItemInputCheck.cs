using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form item input checkbox control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputCheck
    {
        /// <summary>
        /// Tests the id property of the form check box control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""form-check""><input type=""checkbox"" class=""form-check-input""><label class=""form-check-label""></label></div>")]
        [InlineData("id", @"<div id=""id"" class=""form-check""><input name=""id"" type=""checkbox"" class=""form-check-input""><label class=""form-check-label"" for=""id""></label></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCheck(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form check box control.
        /// </summary>
        [Theory]
        [InlineData(@"<div id=""*"" class=""form-check""><input name=""*"" type=""checkbox"" class=""form-check-input""><label class=""form-check-label"" for=""*""></label></div>")]
        public void AutoId(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCheck()
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Inline property of the form check box control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""form-check""><input type=""checkbox"" class=""form-check-input""><label class=""form-check-label""></label></div>")]
        [InlineData(true, @"<div class=""form-check form-check-inline""><input type=""checkbox"" class=""form-check-input""><label class=""form-check-label""></label></div>")]
        public void Inline(bool inline, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCheck(null)
            {
                Inline = inline
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Description property of the form check box control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""form-check""><input type=""checkbox"" class=""form-check-input""><label class=""form-check-label""></label></div>")]
        [InlineData("description", @"<div class=""form-check""><input type=""checkbox"" class=""form-check-input""><label class=""form-check-label"">description</label></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""form-check""><input type=""checkbox"" class=""form-check-input""><label class=""form-check-label"">WebExpress.WebUI</label></div>")]
        public void Description(string description, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCheck(null)
            {
                Description = description
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Layout property of the form check box control.
        /// </summary>
        [Theory]
        [InlineData(TypeLayoutCheck.Default, @"<div class=""form-check""><input type=""checkbox"" class=""form-check-input""><label class=""form-check-label""></label></div>")]
        [InlineData(TypeLayoutCheck.Switch, @"<div class=""form-check form-switch""><input type=""checkbox"" class=""form-check-input""><label class=""form-check-label""></label></div>")]
        public void Layout(TypeLayoutCheck layout, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCheck(null)
            {
                Layout = layout
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value method of the form check box control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div class=""form-check""><input type=""checkbox"" class=""form-check-input""><label class=""form-check-label""></label></div>*")]
        [InlineData(false, @"*<div class=""form-check""><input type=""checkbox"" class=""form-check-input""><label class=""form-check-label""></label></div>*")]
        [InlineData(true, @"*<div class=""form-check""><input type=""checkbox"" class=""form-check-input"" checked><label class=""form-check-label""></label></div>*")]
        public void ValueForm(bool? value, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCheck(null);
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueBool(value ?? false));
            });

            // act
            var html = form.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value method of the form check box control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div class=""form-check""><input type=""checkbox"" class=""form-check-input""><label class=""form-check-label""></label></div>*")]
        [InlineData(false, @"*<div class=""form-check""><input type=""checkbox"" class=""form-check-input""><label class=""form-check-label""></label></div>*")]
        [InlineData(true, @"*<div class=""form-check""><input type=""checkbox"" class=""form-check-input"" checked><label class=""form-check-label""></label></div>*")]
        public void ValueItem(bool? value, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCheck(null).Initialize(args =>
            {
                args.Value.Checked = value ?? false;
            });
            var form = new ControlForm().Add(control);

            // act
            var html = form.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
