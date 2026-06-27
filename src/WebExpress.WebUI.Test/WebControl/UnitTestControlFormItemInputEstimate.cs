using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form estimate control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputEstimate
    {
        /// <summary>
        /// Tests the id property of the form estimate control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-estimate""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-input-estimate"" name=""id""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputEstimate(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form estimate control.
        /// </summary>
        [Theory]
        [InlineData(@"<div id=""*"" class=""wx-webui-input-estimate"" name=""*""></div>")]
        public void AutoId(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputEstimate()
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form estimate control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-estimate""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-estimate"" name=""abc""></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputEstimate(null)
            {
                Name = _ => name
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the form estimate control.
        /// </summary>
        [Theory]
        [InlineData(uint.MaxValue, @"*<div class=""wx-webui-input-estimate""></div>*")]
        [InlineData(0, @"*<div class=""wx-webui-input-estimate"" data-value=""0""></div>*")]
        [InlineData(8, @"*<div class=""wx-webui-input-estimate"" data-value=""8""></div>*")]
        public void Value(uint value, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputEstimate(null);
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueUInt(value));
            });

            // act
            var html = form.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the scale property of the form estimate control.
        /// </summary>
        [Theory]
        [InlineData(@"<div class=""wx-webui-input-estimate"" data-scale=""1,2,3,5,8""></div>")]
        public void Scale(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputEstimate(null)
            {
                Scale = _ => [1, 2, 3, 5, 8]
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the allow clear property of the form estimate control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-input-estimate""></div>")]
        [InlineData(true, @"<div class=""wx-webui-input-estimate"" data-allow-clear=""true""></div>")]
        public void AllowClear(bool allowClear, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputEstimate(null)
            {
                AllowClear = _ => allowClear
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the colors property of the form estimate control, emitted as two
        /// index-aligned, pipe-separated lists: a system color contributes a css
        /// class, a user color an inline style.
        /// </summary>
        [Fact]
        public void Colors()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputEstimate(null)
            {
                Colors = _ =>
                [
                    new PropertyColorBackground(TypeColorBackground.Success),
                    new PropertyColorBackground("#ff0000")
                ]
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-input-estimate"" data-colors-css=""bg-success|"" data-colors-style=""|background:#ff0000;""></div>", html);
        }

        /// <summary>
        /// Tests the label property of the form estimate control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-estimate""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-estimate""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-input-estimate""></div>")]
        public void Label(string label, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputEstimate(null)
            {
                Label = _ => label
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the form estimate control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-estimate""></div>")]
        [InlineData(typeof(IconFolder), @"<div class=""wx-webui-input-estimate""></div>")]
        public void Icon(Type iconType, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var icon = iconType is not null ? Activator.CreateInstance(iconType) as IIcon : null;
            var control = new ControlFormItemInputEstimate(null)
            {
                Icon = _ => icon
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
