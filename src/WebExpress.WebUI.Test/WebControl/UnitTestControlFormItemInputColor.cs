using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form item input color control.
    /// </summary>
    public class UnitTestControlFormItemInputColor
    {
        /// <summary>
        /// Tests the id property of the form color control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-color""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-input-color"" name=""id""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputColor(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form color control.
        /// </summary>
        [Theory]
        [InlineData(@"<div id=""*"" class=""wx-webui-input-color"" name=""*""></div>")]
        public void AutoId(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputColor()
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the form color control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-color""></div>")]
        [InlineData("red", @"<div class=""wx-webui-input-color"" data-value=""red""></div>")]
        public void Color(string color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputColor(null)
            {
                Color = _ => color
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Verifies that the host carries the name the client moves onto the hidden input it posts
        /// through; without it the picked color is never sent and the form keeps the old one.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div id=""color"" class=""wx-webui-input-color"" name=""color""></div>")]
        [InlineData("accent", @"<div id=""color"" class=""wx-webui-input-color"" name=""accent""></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputColor("color");
            if (name is not null)
            {
                control.Name = _ => name;
            }

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Verifies that a disabled field marks its host, which the client reads to lock the
        /// picker and to leave the hidden input out of the submission.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div id=""color"" class=""wx-webui-input-color"" name=""color""></div>")]
        [InlineData(true, @"<div id=""color"" class=""wx-webui-input-color"" name=""color"" disabled></div>")]
        public void Disabled(bool disabled, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputColor("color")
            {
                Disabled = _ => disabled
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value method of the form color control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div id=""*"" class=""wx-webui-input-color""></div>*")]
        [InlineData("red", @"*<div id=""*"" class=""wx-webui-input-color"" data-value=""red""></div>*")]
        public void ValueForm(string value, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputColor(null);
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueString(value));
            });

            // act
            var html = form.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value method of the form color control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div id=""*"" class=""wx-webui-input-color""></div>*")]
        [InlineData("red", @"*<div id=""*"" class=""wx-webui-input-color"" data-value=""red""></div>*")]
        public void ValueItem(string value, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputColor(null).Initialize(args =>
            {
                args.Value.Text = value;
            });
            var form = new ControlForm().Add(control);

            // act
            var html = form.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
