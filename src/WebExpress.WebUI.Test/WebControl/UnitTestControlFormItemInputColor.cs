using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form item input color control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputColor
    {
        /// <summary>
        /// Tests the id property of the form color control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-color""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-input-color""></div>")]
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
        [InlineData(@"<div id=""*"" class=""wx-webui-input-color""></div>")]
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
                Color = color
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
        [InlineData(null, @"*<div class=""wx-webui-input-color""></div>*")]
        [InlineData("red", @"*<div class=""wx-webui-input-color"" data-value=""red""></div>*")]
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
        [InlineData(null, @"*<div class=""wx-webui-input-color""></div>*")]
        [InlineData("red", @"*<div class=""wx-webui-input-color"" data-value=""red""></div>*")]
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
