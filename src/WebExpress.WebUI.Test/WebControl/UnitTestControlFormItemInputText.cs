using WebExpress.WebCore.WebParameter;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form text control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputText
    {
        /// <summary>
        /// Tests the id property of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input type=""text"" class=""form-control"">")]
        [InlineData("id", @"<input id=""id"" name=""id"" type=""text"" class=""form-control"">")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form text control.
        /// </summary>
        [Theory]
        [InlineData(@"<input id=""*"" name=""*"" type=""text"" class=""form-control"">")]
        public void AutoId(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText()
            {
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(null)
            {
                Name = _ => name
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the format property of the form text control.
        /// </summary>
        [Theory]
        [InlineData(TypeEditTextFormat.Default, @"<input type=""text"" class=""form-control"">")]
        [InlineData(TypeEditTextFormat.Multiline, @"<textarea class=""form-control"" rows=""8""></textarea>")]
        [InlineData(TypeEditTextFormat.Wysiwyg, @"<div class=""wx-webui-editor form-control""></div>")]
        public void Format(TypeEditTextFormat format, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(null)
            {
                Format = _ => format
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the fill mode reaches the rich-text surface, and only it: the other
        /// formats size themselves from the row count, so an editor attribute on them would
        /// promise a behaviour their markup cannot have.
        /// </summary>
        [Theory]
        [InlineData(TypeEditTextFormat.Wysiwyg, true, @"<div class=""wx-webui-editor form-control"" data-fill=""true""></div>")]
        [InlineData(TypeEditTextFormat.Wysiwyg, false, @"<div class=""wx-webui-editor form-control""></div>")]
        [InlineData(TypeEditTextFormat.Multiline, true, @"<textarea class=""form-control"" rows=""8""></textarea>")]
        [InlineData(TypeEditTextFormat.Default, true, @"<input type=""text"" class=""form-control"">")]
        public void Fill(TypeEditTextFormat format, bool fill, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(null)
            {
                Format = _ => format,
                Fill = _ => fill
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that an undeclared fill resolver leaves the editor markup untouched, so a
        /// control written before the mode existed renders exactly as it did.
        /// </summary>
        [Fact]
        public void FillNotDeclared()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(null)
            {
                Format = _ => TypeEditTextFormat.Wysiwyg
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-editor form-control""></div>", html);
        }

        /// <summary>
        /// Tests the description property of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input type=""text"" class=""form-control"">")]
        [InlineData("abc", @"<input type=""text"" class=""form-control"">")]
        public void Description(string description, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(null)
            {
                Description = _ => description
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input type=""text"" class=""form-control"">")]
        [InlineData("abc", @"<input type=""text"" class=""form-control"" placeholder=""abc"">")]
        [InlineData("webexpress.webui:plugin.name", @"<input type=""text"" class=""form-control"" placeholder=""WebExpress.WebUI"">")]
        public void Placeholder(string placeholder, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(null)
            {
                Placeholder = _ => placeholder
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(null)
            {
                MinLength = _ => minLength
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(null)
            {
                MaxLength = _ => maxLength
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(null)
            {
                Required = _ => required
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(null)
            {
                Pattern = _ => pattern
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(null)
            {
                Rows = _ => rows,
                Format = _ => TypeEditTextFormat.Multiline
            };

            // act
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
            // arrange
            var initialized = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(null);
            var form = new ControlForm().Add(control)
                .Initialize(renderContext =>
                {
                    renderContext.SetValue(control, new ControlFormInputValueString(value));
                    initialized = true;
                });

            // act
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
            // arrange
            var initialized = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(null)
                .Initialize(arg =>
                {
                    arg.Value.Text = value;
                    initialized = true;
                });
            var form = new ControlForm().Add(control);

            // act
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
            // arrange
            var validated = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var control = new ControlFormItemInputText("text-box").Initialize(args =>
            {
                args.Value.Text = value;
            });
            var form = new ControlForm() { Name = _ => "form" }
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
            var context = UnitTestControlFixture.CreateRenderContextMock
            (
                null,
                null,
                new Parameter("form", "", ParameterScope.Parameter)
            );
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            context.Request.AddParameter(new Parameter(form.Id, context.Request?.Session.Id.ToString(), ParameterScope.Parameter));
            context.Request.AddParameter(new Parameter("text-box", value, ParameterScope.Parameter));

            // act
            var html = form.Render(context, visualTree);

            // validation
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
            // arrange
            var validated = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var control = new ControlFormItemInputText("text-box")
                .Validate
                (
                    x =>
                    {
                        x
                        .Add(x.Value is not null, "validation1", TypeInputValidity.Warning)
                        .Add(x.Value?.Text?.Length > 3, "validation2")
                        .Add(false, "validation3");
                        validated = true;
                    }
                );
            var form = new ControlForm() { Name = _ => "form" }
                .Add(control);
            var context = UnitTestControlFixture.CreateRenderContextMock
            (
                null,
                null,
                new Parameter("form", "", ParameterScope.Parameter)
            );
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            context.Request.AddParameter(new Parameter(form.Id, context.Request?.Session.Id.ToString(), ParameterScope.Parameter));
            context.Request.AddParameter(new Parameter("text-box", value, ParameterScope.Parameter));

            // act
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
            // arrange
            var processed = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var control = new ControlFormItemInputText("text-box")
                .Initialize(args =>
                {
                    args.Value.Text = value;
                });
            var form = new ControlForm() { Name = _ => "form" }
                .Add(control)
                .Process
                (
                    x =>
                    {
                        processed = true;
                    }
                );
            var context = UnitTestControlFixture.CreateRenderContextMock
            (
                null,
                null,
                new Parameter("form", "", ParameterScope.Parameter)
            );
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            context.Request.AddParameter(new Parameter(form.Id, context.Request?.Session.Id.ToString(), ParameterScope.Parameter));
            context.Request.AddParameter(new Parameter("text-box", value, ParameterScope.Parameter));

            // act
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
            // arrange
            var processed = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var control = new ControlFormItemInputText("text-box")
                .Initialize(x => x.Value.Text = value)
                .Process(x => processed = true);
            var form = new ControlForm() { Name = _ => "form" }
                .Add(control);
            var context = UnitTestControlFixture.CreateRenderContextMock
            (
                null,
                null,
                new Parameter("form", "", ParameterScope.Parameter)
            );
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            context.Request.AddParameter(new Parameter(form.Id, context.Request?.Session.Id.ToString(), ParameterScope.Parameter));
            context.Request.AddParameter(new Parameter("text-box", value, ParameterScope.Parameter));

            // act
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(processed);
        }

        /// <summary>
        /// Tests the server side min length check of the form text control. The native
        /// constraint only guards the browser, so a value that arrived another way has
        /// to be caught here.
        /// </summary>
        [Theory]
        [InlineData(null, false)]
        [InlineData("ab", true)]
        [InlineData("abc", false)]
        [InlineData("abcd", false)]
        public void ValidateMinLength(string value, bool expectedError)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var control = new ControlFormItemInputText("text-box")
            {
                MinLength = _ => 3u
            };

            if (value is not null)
            {
                context.SetValue(control, new ControlFormInputValueString(value));
            }

            // act
            var results = control.Validate(context).ToList();

            // validation
            Assert.Equal(expectedError, results.Any(x => x.Type == TypeInputValidity.Error));
        }

        /// <summary>
        /// Tests the server side max length check of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, false)]
        [InlineData("abc", false)]
        [InlineData("abcd", false)]
        [InlineData("abcde", true)]
        public void ValidateMaxLength(string value, bool expectedError)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var control = new ControlFormItemInputText("text-box")
            {
                MaxLength = _ => 4u
            };

            if (value is not null)
            {
                context.SetValue(control, new ControlFormInputValueString(value));
            }

            // act
            var results = control.Validate(context).ToList();

            // validation
            Assert.Equal(expectedError, results.Any(x => x.Type == TypeInputValidity.Error));
        }
    }
}
