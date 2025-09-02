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
    public class UnitTestControlFormItemInputTag
    {
        /// <summary>
        /// Tests the id property of the form tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-tag""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-input-tag"" name=""id""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTag(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form tag control.
        /// </summary>
        [Theory]
        [InlineData(@"<div id=""*"" class=""wx-webui-input-tag"" name=""*""></div>")]
        public void AutoId(string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTag()
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-tag""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-tag"" name=""abc""></div>")]
        public void Name(string name, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTag(null)
            {
                Name = name
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the form tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-tag""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-tag"" placeholder=""abc""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-input-tag"" placeholder=""WebExpress.WebUI""></div>")]
        public void Placeholder(string placeholder, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTag(null)
            {
                Placeholder = placeholder
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the form tag control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorTag.Default, @"<div class=""wx-webui-input-tag""></div>")]
        [InlineData(TypeColorTag.Primary, @"<div class=""wx-webui-input-tag"" data-color-css=""wx-tag-primary""></div>")]
        [InlineData(TypeColorTag.Secondary, @"<div class=""wx-webui-input-tag"" data-color-css=""wx-tag-secondary""></div>")]
        [InlineData(TypeColorTag.Info, @"<div class=""wx-webui-input-tag"" data-color-css=""wx-tag-info""></div>")]
        [InlineData(TypeColorTag.Success, @"<div class=""wx-webui-input-tag"" data-color-css=""wx-tag-success""></div>")]
        [InlineData(TypeColorTag.Warning, @"<div class=""wx-webui-input-tag"" data-color-css=""wx-tag-warning""></div>")]
        [InlineData(TypeColorTag.Danger, @"<div class=""wx-webui-input-tag"" data-color-css=""wx-tag-danger""></div>")]
        [InlineData(TypeColorTag.Light, @"<div class=""wx-webui-input-tag"" data-color-css=""wx-tag-light""></div>")]
        [InlineData(TypeColorTag.Dark, @"<div class=""wx-webui-input-tag"" data-color-css=""wx-tag-dark""></div>")]
        public void Color(TypeColorTag color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTag(null)
            {
                Color = new PropertyColorTag(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the form tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-tag""></div>")]
        [InlineData("gold", @"<div class=""wx-webui-input-tag"" data-color-style=""background: gold;""></div>")]
        public void UserColor(string color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTag(null)
            {
                Color = new PropertyColorTag(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value method of the form tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div class=""wx-webui-input-tag""></div>*")]
        [InlineData("abc", @"*<div class=""wx-webui-input-tag"" data-value=""abc""></div>*")]
        public void ValueForm(string value, string expected)
        {
            // preconditions
            var initialized = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTag(null);
            var form = new ControlForm().Add(control)
                .Initialize(renderContext =>
                {
                    renderContext.SetValue(control, new ControlFormInputValueStringList(value));
                    initialized = true;
                });

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(initialized);
        }

        /// <summary>
        /// Tests the value method of the form tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div class=""wx-webui-input-tag""></div>*")]
        [InlineData("abc", @"*<div class=""wx-webui-input-tag"" data-value=""abc""></div>*")]
        public void ValueItem(string value, string expected)
        {
            // preconditions
            var initialized = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTag(null)
                .Initialize(arg =>
                {
                    arg.Value.Add(value);
                    initialized = true;
                });
            var form = new ControlForm().Add(control);

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(initialized);
        }

        /// <summary>
        /// Tests the validate method of the form tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div id=""tag"" class=""wx-webui-input-tag"" name=""tag""></div>*")]
        [InlineData("abc", @"*<div id=""tag"" class=""wx-webui-input-tag"" name=""tag"" data-value=""abc""></div>*")]
        public void ValidateForm(string value, string expected)
        {
            // preconditions
            var validated = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTag("tag").Initialize(args =>
            {
                args.Value.Add(value);
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

            context.Request.AddParameter(new Parameter
            (
                form.Id,
                context.Request?.Session.Id.ToString(),
                ParameterScope.Parameter
            ));
            context.Request.AddParameter(new Parameter
            (
                "text-box",
                value,
                ParameterScope.Parameter
            ));

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(validated);
        }

        /// <summary>
        /// Tests the validate method of the form tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div id=""tag"" class=""wx-webui-input-tag"" name=""tag""></div>*")]
        [InlineData("abc", @"*<div id=""tag"" class=""wx-webui-input-tag"" name=""tag"" data-value=""abc""></div>*")]
        public void ValidateItem(string value, string expected)
        {
            // preconditions
            var validated = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTag("tag")
                .Validate
                (
                    x =>
                    {
                        x
                        .Add(x.Value != null, "validation1", TypeInputValidity.Warning)
                        .Add(x.Value?.Items.Count() > 3, "validation2")
                        .Add(false, "validation3");
                        validated = true;
                    }
                );
            var form = new ControlForm()
                .Add(control);

            context.Request.AddParameter(new Parameter(form.Id, context.Request?.Session.Id.ToString(), ParameterScope.Parameter));
            context.Request.AddParameter(new Parameter("tag", value, ParameterScope.Parameter));

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(validated);
        }

        /// <summary>
        /// Tests the process method of the form tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div id=""tag"" class=""wx-webui-input-tag"" name=""tag""></div>*")]
        [InlineData("abc", @"*<div id=""tag"" class=""wx-webui-input-tag"" name=""tag"" data-value=""abc""></div>*")]
        public void ProcessForm(string value, string expected)
        {
            // preconditions
            var processed = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTag("tag")
                .Initialize(args =>
                {
                    args.Value.Add(value);
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
            context.Request.AddParameter(new Parameter("tag", value, ParameterScope.Parameter));

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(processed);
        }

        /// <summary>
        /// Tests the process method of the form tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div id=""tag"" class=""wx-webui-input-tag"" name=""tag""></div>*")]
        [InlineData("abc", @"*<div id=""tag"" class=""wx-webui-input-tag"" name=""tag"" data-value=""abc""></div>*")]
        public void ProcessItem(string value, string expected)
        {
            // preconditions
            var processed = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTag("tag")
                .Initialize(arg =>
                {
                    arg.Value.Add(value);
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
            context.Request.AddParameter(new Parameter("tag", value, ParameterScope.Parameter));

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(processed);
        }
    }
}
