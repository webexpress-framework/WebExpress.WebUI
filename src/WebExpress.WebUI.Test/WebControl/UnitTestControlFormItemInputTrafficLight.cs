using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form traffic light input control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputTrafficLight
    {
        /// <summary>
        /// Tests the id property of the form traffic light control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-traffic-light""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-input-traffic-light"" name=""id""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTrafficLight(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form traffic light control.
        /// </summary>
        [Theory]
        [InlineData(@"<div id=""*"" class=""wx-webui-input-traffic-light"" name=""*""></div>")]
        public void AutoId(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTrafficLight()
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form traffic light control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-traffic-light""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-traffic-light"" name=""abc""></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTrafficLight(null)
            {
                Name = _ => name
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the form traffic light control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div class=""wx-webui-input-traffic-light""></div>*")]
        [InlineData("", @"*<div class=""wx-webui-input-traffic-light""></div>*")]
        [InlineData("green", @"*<div class=""wx-webui-input-traffic-light"" data-value=""green""></div>*")]
        public void Value(string value, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTrafficLight(null);
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
        /// Tests the orientation property of the form traffic light control. The vertical default
        /// is implied and therefore not emitted.
        /// </summary>
        [Theory]
        [InlineData(TypeOrientationTrafficLight.Vertical, @"<div class=""wx-webui-input-traffic-light""></div>")]
        [InlineData(TypeOrientationTrafficLight.Horizontal, @"<div class=""wx-webui-input-traffic-light"" data-orientation=""horizontal""></div>")]
        public void Orientation(TypeOrientationTrafficLight orientation, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTrafficLight(null)
            {
                Orientation = _ => orientation
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the allow off property of the form traffic light control. Clearing is allowed by
        /// default, so only the disabled deviation is emitted.
        /// </summary>
        [Theory]
        [InlineData(true, @"<div class=""wx-webui-input-traffic-light""></div>")]
        [InlineData(false, @"<div class=""wx-webui-input-traffic-light"" data-allow-off=""false""></div>")]
        public void AllowOff(bool allowOff, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTrafficLight(null)
            {
                AllowOff = _ => allowOff
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the form traffic light control. The compact default is
        /// implied and therefore emits no modifier class.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeTrafficLight.Default, @"<div class=""wx-webui-input-traffic-light""></div>")]
        [InlineData(TypeSizeTrafficLight.Small, @"<div class=""wx-webui-input-traffic-light wx-traffic-light-sm""></div>")]
        [InlineData(TypeSizeTrafficLight.ExtraLarge, @"<div class=""wx-webui-input-traffic-light wx-traffic-light-xl""></div>")]
        public void Size(TypeSizeTrafficLight size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTrafficLight(null)
            {
                Size = _ => size
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the label property of the form traffic light control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-traffic-light""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-traffic-light""></div>")]
        public void Label(string label, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputTrafficLight(null)
            {
                Label = _ => label
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the form traffic light control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-traffic-light""></div>")]
        [InlineData(typeof(IconFolder), @"<div class=""wx-webui-input-traffic-light""></div>")]
        public void Icon(Type iconType, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var icon = iconType is not null ? Activator.CreateInstance(iconType) as IIcon : null;
            var control = new ControlFormItemInputTrafficLight(null)
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
