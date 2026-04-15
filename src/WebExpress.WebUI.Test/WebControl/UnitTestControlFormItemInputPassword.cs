using WebExpress.WebCore.WebParameter;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form password control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputPassword
    {
        /// <summary>
        /// Tests the id property of the form password control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-password""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-input-password"" name=""id""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputPassword(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form password control.
        /// </summary>
        [Theory]
        [InlineData(@"<div id=""*"" class=""wx-webui-input-password"" name=""*""></div>")]
        public void AutoId(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputPassword()
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form password control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-password""></div>")]
        [InlineData("pw", @"<div class=""wx-webui-input-password"" name=""pw""></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputPassword(null)
            {
                Name = name
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the form password control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-password""></div>")]
        [InlineData("Enter password", @"<div class=""wx-webui-input-password"" data-placeholder=""Enter password""></div>")]
        public void Placeholder(string placeholder, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputPassword(null)
            {
                Placeholder = placeholder
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the min length property of the form password control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-password""></div>")]
        [InlineData(0u, @"<div class=""wx-webui-input-password"" data-minlength=""0""></div>")]
        [InlineData(8u, @"<div class=""wx-webui-input-password"" data-minlength=""8""></div>")]
        public void MinLength(uint? minLength, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputPassword(null)
            {
                MinLength = minLength
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the max length property of the form password control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-password""></div>")]
        [InlineData(0u, @"<div class=""wx-webui-input-password"" data-maxlength=""0""></div>")]
        [InlineData(64u, @"<div class=""wx-webui-input-password"" data-maxlength=""64""></div>")]
        public void MaxLength(uint? maxLength, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputPassword(null)
            {
                MaxLength = maxLength
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the disabled property of the form password control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-input-password""></div>")]
        [InlineData(true, @"<div class=""wx-webui-input-password"" data-disabled=""true""></div>")]
        public void DisabledProperty(bool disabled, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputPassword(null)
            {
                Disabled = disabled
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value method of the form password control using item initialization.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div class=""wx-webui-input-password""></div>*")]
        [InlineData("secret", @"*<div class=""wx-webui-input-password"" data-value=""secret""></div>*")]
        public void ValueItem(string value, string expected)
        {
            // arrange
            var initialized = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputPassword(null)
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
        /// Tests the process method of the form password control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div id=""pw-box"" class=""wx-webui-input-password"" name=""pw-box""></div>*")]
        [InlineData("secret", @"*<div id=""pw-box"" class=""wx-webui-input-password"" name=""pw-box"" data-value=""secret""></div>*")]
        public void ProcessItem(string value, string expected)
        {
            // arrange
            var processed = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputPassword("pw-box")
                .Initialize(x => x.Value.Text = value)
                .Process(x => processed = true);
            var form = new ControlForm()
                .Add(control);

            context.Request.AddParameter(new Parameter(form.Id, context.Request?.Session.Id.ToString(), ParameterScope.Parameter));
            context.Request.AddParameter(new Parameter("pw-box", value, ParameterScope.Parameter));

            // act
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
            Assert.True(processed);
        }
    }
}
