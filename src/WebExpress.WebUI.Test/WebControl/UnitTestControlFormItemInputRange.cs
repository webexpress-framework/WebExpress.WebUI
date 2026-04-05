using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form item input range control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputRange
    {
        /// <summary>
        /// Tests the id property of the form range control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input class=""form-range"" type=""range"" min=""0"" max=""10"" step=""1"">")]
        [InlineData("id", @"<input id=""id"" name=""id"" class=""form-range"" type=""range"" min=""0"" max=""10"" step=""1"">")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRange(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form range control.
        /// </summary>
        [Theory]
        [InlineData(@"<input id=""*"" class=""form-range"" type=""range"" min=""0"" max=""10"" step=""1"">")]
        public void AutoId(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRange()
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the min property of the form range control.
        /// </summary>
        [Theory]
        [InlineData(0, @"<input class=""form-range"" type=""range"" min=""0"" max=""10"" step=""1"">")]
        [InlineData(1.5, @"<input class=""form-range"" type=""range"" min=""1.5"" max=""10"" step=""1"">")]
        public void Min(float min, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRange(null)
            {
                Min = min
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the max property of the form range control.
        /// </summary>
        [Theory]
        [InlineData(0, @"<input class=""form-range"" type=""range"" min=""0"" max=""0"" step=""1"">")]
        [InlineData(1.0, @"<input class=""form-range"" type=""range"" min=""0"" max=""1"" step=""1"">")]
        public void Max(float max, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRange(null)
            {
                Max = max
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the step property of the form range control.
        /// </summary>
        [Theory]
        [InlineData(0, @"<input class=""form-range"" type=""range"" min=""0"" max=""10"" step=""0"">")]
        [InlineData(1.0, @"<input class=""form-range"" type=""range"" min=""0"" max=""10"" step=""1"">")]
        public void Step(float step, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRange(null)
            {
                Step = step
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Description property of the form item input radio control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input class=""form-range"" type=""range"" min=""0"" max=""10"" step=""1"">")]
        [InlineData("description", @"<input class=""form-range"" type=""range"" min=""0"" max=""10"" step=""1"">")]
        [InlineData("webexpress.WebUI:plugin.name", @"<input class=""form-range"" type=""range"" min=""0"" max=""10"" step=""1"">")]
        public void Description(string description, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRange(null)
            {
                Description = description
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the disabled property of the form range control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<input class=""form-range"" type=""range"" min=""0"" max=""10"" step=""1"">")]
        [InlineData(true, @"<input class=""form-range"" type=""range"" min=""0"" max=""10"" step=""1"" disabled>")]
        public void Disabled(bool disabled, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRange(null)
            {
                Disabled = disabled
            };


            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value method of the form range control.
        /// </summary>
        [Theory]
        [InlineData(0, @"<form id=""*"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data""><input name=""*"" type=""hidden""><main><div><fieldset class=""wx-form-group""><input class=""form-range"" type=""range"" min=""0"" max=""10"" step=""1"" value=""0""></fieldset></div></main><div></div></form>")]
        [InlineData(1, @"<form id=""*"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data""><input name=""*"" type=""hidden""><main><div><fieldset class=""wx-form-group""><input class=""form-range"" type=""range"" min=""0"" max=""10"" step=""1"" value=""1""></fieldset></div></main><div></div></form>")]
        [InlineData(2.2, @"<form id=""*"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data""><input name=""*"" type=""hidden""><main><div><fieldset class=""wx-form-group""><input class=""form-range"" type=""range"" min=""0"" max=""10"" step=""1"" value=""2.2""></fieldset></div></main><div></div></form>")]
        public void ValueForm(float value, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRange(null);
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueFloat(value));
            });

            // act
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
