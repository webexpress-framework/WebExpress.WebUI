using WebExpress.WebCore.WebMessage;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form text control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputTextBox
    {
        /// <summary>
        /// Tests the id property of the form label control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input type=""text"" class=""form-control"">")]
        [InlineData("id", @"<input id=""id"" name=""id"" type=""text"" class=""form-control"">")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form text box control.
        /// </summary>
        [Theory]
        [InlineData(@"<input id=""*"" name=""*"" type=""text"" class=""form-control"">")]
        public void AutoId(string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox()
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input type=""text"" class=""form-control"">")]
        [InlineData("abc", @"<input name=""abc"" type=""text"" class=""form-control"">")]
        public void Name(string name, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox(null)
            {
                Name = name
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the format property of the form text control.
        /// </summary>
        [Theory]
        [InlineData(TypeEditTextFormat.Default, @"<input type=""text"" class=""form-control"">")]
        [InlineData(TypeEditTextFormat.Multiline, @"<textarea class=""form-control"" rows=""8""></textarea>")]
        [InlineData(TypeEditTextFormat.Wysiwyg, @"<textarea id=""*"" class=""form-control"" rows=""8""></textarea>")]
        public void Format(TypeEditTextFormat format, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox(null)
            {
                Format = format
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the description property of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input type=""text"" class=""form-control"">")]
        [InlineData("abc", @"<input type=""text"" class=""form-control"">")]
        public void Description(string description, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox(null)
            {
                Description = description
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input type=""text"" class=""form-control"">")]
        [InlineData("abc", @"<input type=""text"" class=""form-control"" placeholder=""abc"">")]
        public void Placeholder(string placeholder, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox(null)
            {
                Placeholder = placeholder
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the min length property of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input type=""text"" class=""form-control"">")]
        [InlineData(0u, @"<input minlength=""0"" type=""text"" class=""form-control"">")]
        [InlineData(10u, @"<input minlength=""10"" type=""text"" class=""form-control"">")]
        public void MinLength(uint? minLength, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox(null)
            {
                MinLength = minLength
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the max length property of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input type=""text"" class=""form-control"">")]
        [InlineData(0u, @"<input maxlength=""0"" type=""text"" class=""form-control"">")]
        [InlineData(10u, @"<input maxlength=""10"" type=""text"" class=""form-control"">")]
        public void MaxLength(uint? maxLength, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox(null)
            {
                MaxLength = maxLength
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the required property of the form text control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<input type=""text"" class=""form-control"">")]
        [InlineData(true, @"<input required type=""text"" class=""form-control"">")]
        public void Required(bool required, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox(null)
            {
                Required = required
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the pattern property of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input type=""text"" class=""form-control"">")]
        [InlineData("abc.*", @"<input pattern=""abc.*"" type=""text"" class=""form-control"">")]
        public void Pattern(string pattern, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox(null)
            {
                Pattern = pattern
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the rows property of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<textarea class=""form-control""></textarea>")]
        [InlineData(0u, @"<textarea class=""form-control"" rows=""0""></textarea>")]
        [InlineData(10u, @"<textarea class=""form-control"" rows=""10""></textarea>")]
        public void Rows(uint? rows, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox(null)
            {
                Rows = rows,
                Format = TypeEditTextFormat.Multiline
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value method of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<input type=""text"" class=""form-control"">*")]
        [InlineData("abc", @"*<input value=""abc"" type=""text"" class=""form-control"">*")]
        public void ValueForm(string value, string expected)
        {
            // preconditions
            var initialized = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox(null);
            var form = new ControlForm().Add(control)
                .Initialize(renderContext =>
                {
                    renderContext.SetValue(control, value);
                    initialized = true;
                });

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(initialized);
        }

        /// <summary>
        /// Tests the value method of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<input type=""text"" class=""form-control"">*")]
        [InlineData("abc", @"*<input value=""abc"" type=""text"" class=""form-control"">*")]
        public void ValueItem(string value, string expected)
        {
            // preconditions
            var initialized = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox(null)
                .Initialize(arg =>
                {
                    arg.Value = value;
                    initialized = true;
                });
            var form = new ControlForm().Add(control);

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(initialized);
        }

        /// <summary>
        /// Tests the validate method of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<input id=""text-box"" name=""text-box"" type=""text"" class=""form-control"">*")]
        [InlineData("abc", @"*<input id=""text-box"" value=""abc"" name=""text-box"" type=""text"" class=""form-control"">*")]
        public void ValidateForm(string value, string expected)
        {
            // preconditions
            var validated = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox("text-box").Initialize(args =>
            {
                args.Value = value;
            });
            var form = new ControlForm()
                .Add(control)
                .Validate
                (
                    x =>
                    {
                        x
                        .Add(true, "validation1", TypeInputValidity.Warning)
                        .Add(true, "validation2")
                        .Add(false, "validation3");
                        validated = true;
                    }
                );

            context.Request.AddParameter(new Parameter(form.Id, context.Request?.Session.Id.ToString(), ParameterScope.Parameter));
            context.Request.AddParameter(new Parameter("text-box", value, ParameterScope.Parameter));

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(validated);
        }

        /// <summary>
        /// Tests the validate method of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<input id=""text-box"" name=""text-box"" type=""text"" class=""form-control"">*")]
        [InlineData("abc", @"*<input id=""text-box"" value=""abc"" name=""text-box"" type=""text"" class=""form-control"">*")]
        public void ValidateItem(string value, string expected)
        {
            // preconditions
            var validated = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox("text-box")
                .Validate
                (
                    x =>
                    {
                        x
                        .Add(x.Value != null, "validation1", TypeInputValidity.Warning)
                        .Add(x.Value?.Length > 3, "validation2")
                        .Add(false, "validation3");
                        validated = true;
                    }
                );
            var form = new ControlForm()
                .Add(control);

            context.Request.AddParameter(new Parameter(form.Id, context.Request?.Session.Id.ToString(), ParameterScope.Parameter));
            context.Request.AddParameter(new Parameter("text-box", value, ParameterScope.Parameter));

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(validated);
        }

        /// <summary>
        /// Tests the process method of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<input id=""text-box"" name=""text-box"" type=""text"" class=""form-control"">*")]
        [InlineData("abc", @"*<input id=""text-box"" value=""abc"" name=""text-box"" type=""text"" class=""form-control"">*")]
        public void ProcessForm(string value, string expected)
        {
            // preconditions
            var processed = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox("text-box")
                .Initialize(args =>
                {
                    args.Value = value;
                });
            var form = new ControlForm()
                .Add(control)
                .Process
                (
                    x =>
                    {
                        processed = true;
                    }
                );

            context.Request.AddParameter(new Parameter(form.Id, context.Request?.Session.Id.ToString(), ParameterScope.Parameter));
            context.Request.AddParameter(new Parameter("text-box", value, ParameterScope.Parameter));

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(processed);
        }

        /// <summary>
        /// Tests the process method of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<input id=""text-box"" name=""text-box"" type=""text"" class=""form-control"">*")]
        [InlineData("abc", @"*<input id=""text-box"" value=""abc"" name=""text-box"" type=""text"" class=""form-control"">*")]
        public void ProcessItem(string value, string expected)
        {
            // preconditions
            var processed = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTextBox("text-box")
                .Initialize(arg =>
                {
                    arg.Value = value;
                })
                .Process
                (
                    x =>
                    {
                        processed = true;
                    }
                );
            var form = new ControlForm()
                .Add(control);

            context.Request.AddParameter(new Parameter(form.Id, context.Request?.Session.Id.ToString(), ParameterScope.Parameter));
            context.Request.AddParameter(new Parameter("text-box", value, ParameterScope.Parameter));

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(processed);
        }
    }
}
