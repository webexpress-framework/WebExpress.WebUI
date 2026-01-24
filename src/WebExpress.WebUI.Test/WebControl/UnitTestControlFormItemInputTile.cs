using WebExpress.WebCore.WebParameter;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form tile picker input control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputTile
    {
        /// <summary>
        /// Tests the id property of the form tile picker control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-tile""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-input-tile"" name=""id""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTile(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form tile picker control.
        /// </summary>
        [Theory]
        [InlineData(@"<div id=""*"" class=""wx-webui-input-tile"" name=""*""></div>")]
        public void AutoId(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTile()
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form tile picker control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-tile""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-tile"" name=""abc""></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTile(null)
            {
                Name = name
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the multi select property of the form tile picker control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-input-tile""></div>")]
        [InlineData(true, @"<div class=""wx-webui-input-tile"" data-multiselect=""true""></div>")]
        public void MultiSelect(bool multiselect, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTile(null)
            {
                MultiSelect = multiselect
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value method of the form tile picker control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div class=""wx-webui-input-tile""></div>*")]
        [InlineData("abc", @"*<div class=""wx-webui-input-tile"" data-value=""abc""></div>*")]
        public void ValueForm(string value, string expected)
        {
            // arrange
            var initialized = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTile(null);
            var form = new ControlForm().Add(control)
                .Initialize(renderContext =>
                {
                    renderContext.SetValue(control, new ControlFormInputValueStringList(value));
                    initialized = true;
                });

            // act
            var html = form.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(initialized);
        }

        /// <summary>
        /// Tests the value method of the form tile picker control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div class=""wx-webui-input-tile""></div>*")]
        [InlineData("abc", @"*<div class=""wx-webui-input-tile"" data-value=""abc""></div>*")]
        public void ValueItem(string value, string expected)
        {
            // arrange
            var initialized = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTile(null)
                .Initialize(arg =>
                {
                    arg.Value.Add(value);
                    initialized = true;
                });
            var form = new ControlForm().Add(control);

            // act
            var html = form.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(initialized);
        }

        /// <summary>
        /// Tests the validate method of the form tile picker control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*alert-warning*<div id=""tile"" class=""wx-webui-input-tile"" name=""tile""></div>*")]
        [InlineData("abc", @"*alert-warning*<div id=""tile"" class=""wx-webui-input-tile"" name=""tile"" data-value=""abc""></div>*")]
        public void ValidateForm(string value, string expected)
        {
            // arrange
            var validated = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTile("tile").Initialize(args =>
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

            // act
            var html = form.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(validated);
        }

        /// <summary>
        /// Tests the validate method of the form tile picker control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*alert-warning*<div id=""tile"" class=""wx-webui-input-tile"" name=""tile""></div>*")]
        [InlineData("abc", @"*alert-warning*<div id=""tile"" class=""wx-webui-input-tile"" name=""tile"" data-value=""abc""></div>*")]
        public void ValidateItem(string value, string expected)
        {
            // arrange
            var validated = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTile("tile")
                .Validate
                (
                    x =>
                    {
                        x
                        .Add(x.Value is not null, "validation1", TypeInputValidity.Warning)
                        .Add(x.Value?.Items.Count() > 3, "validation2")
                        .Add(false, "validation3");
                        validated = true;
                    }
                );
            var form = new ControlForm()
                .Add(control);

            context.Request.AddParameter(new Parameter(form.Id, context.Request?.Session.Id.ToString(), ParameterScope.Parameter));
            context.Request.AddParameter(new Parameter("tile", value, ParameterScope.Parameter));

            // act
            var html = form.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(validated);
        }

        /// <summary>
        /// Tests the process method of the form tile picker control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div id=""tile"" class=""wx-webui-input-tile"" name=""tile""></div>*")]
        [InlineData("abc", @"*<div id=""tile"" class=""wx-webui-input-tile"" name=""tile"" data-value=""abc""></div>*")]
        public void ProcessForm(string value, string expected)
        {
            // arrange
            var processed = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTile("tile")
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
            context.Request.AddParameter(new Parameter("tile", value, ParameterScope.Parameter));

            // act
            var html = form.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(processed);
        }

        /// <summary>
        /// Tests the process method of the form tile picker control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div id=""tile"" class=""wx-webui-input-tile"" name=""tile""></div>*")]
        [InlineData("abc", @"*<div id=""tile"" class=""wx-webui-input-tile"" name=""tile"" data-value=""abc""></div>*")]
        public void ProcessItem(string value, string expected)
        {
            // arrange
            var processed = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTile("tile")
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
            context.Request.AddParameter(new Parameter("tile", value, ParameterScope.Parameter));

            // act
            var html = form.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(processed);
        }
    }
}
