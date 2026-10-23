using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the read-only traffic light control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTrafficLight
    {
        /// <summary>
        /// Tests the id property of the traffic light control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-traffic-light"" data-value=""off""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-traffic-light"" data-value=""off""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTrafficLight(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the state property of the traffic light control.
        /// </summary>
        [Theory]
        [InlineData(TypeTrafficLight.Off, @"<div class=""wx-webui-traffic-light"" data-value=""off""></div>")]
        [InlineData(TypeTrafficLight.Red, @"<div class=""wx-webui-traffic-light"" data-value=""red""></div>")]
        [InlineData(TypeTrafficLight.Yellow, @"<div class=""wx-webui-traffic-light"" data-value=""yellow""></div>")]
        [InlineData(TypeTrafficLight.Green, @"<div class=""wx-webui-traffic-light"" data-value=""green""></div>")]
        public void State(TypeTrafficLight state, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTrafficLight()
            {
                State = _ => state
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the orientation property of the traffic light control. The vertical default is
        /// implied and therefore not emitted.
        /// </summary>
        [Theory]
        [InlineData(TypeOrientationTrafficLight.Vertical, @"<div class=""wx-webui-traffic-light"" data-value=""off""></div>")]
        [InlineData(TypeOrientationTrafficLight.Horizontal, @"<div class=""wx-webui-traffic-light"" data-value=""off"" data-orientation=""horizontal""></div>")]
        public void Orientation(TypeOrientationTrafficLight orientation, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTrafficLight()
            {
                Orientation = _ => orientation
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the traffic light control. The compact default is implied
        /// and therefore emits no modifier class.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeTrafficLight.Default, @"<div class=""wx-webui-traffic-light"" data-value=""off""></div>")]
        [InlineData(TypeSizeTrafficLight.ExtraSmall, @"<div class=""wx-webui-traffic-light wx-traffic-light-xs"" data-value=""off""></div>")]
        [InlineData(TypeSizeTrafficLight.Small, @"<div class=""wx-webui-traffic-light wx-traffic-light-sm"" data-value=""off""></div>")]
        [InlineData(TypeSizeTrafficLight.Large, @"<div class=""wx-webui-traffic-light wx-traffic-light-lg"" data-value=""off""></div>")]
        [InlineData(TypeSizeTrafficLight.ExtraLarge, @"<div class=""wx-webui-traffic-light wx-traffic-light-xl"" data-value=""off""></div>")]
        public void Size(TypeSizeTrafficLight size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTrafficLight()
            {
                Size = _ => size
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the traffic light control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-traffic-light"" data-value=""off""></div>")]
        [InlineData("Status ok", @"<div class=""wx-webui-traffic-light"" data-value=""off"" data-tooltip=""Status ok""></div>")]
        public void Tooltip(string tooltip, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTrafficLight()
            {
                Tooltip = _ => tooltip
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
