using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the traffic light template control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableTemplateTrafficLight
    {
        /// <summary>
        /// Tests the id property of the traffic light template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""traffic-light""></template>")]
        [InlineData("id", @"<template id=""id"" data-type=""traffic-light""></template>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateTrafficLight(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the editable property of the traffic light template control. Read-only is the
        /// implied default, so only the editable deviation is emitted.
        /// </summary>
        [Theory]
        [InlineData(false, @"<template data-type=""traffic-light""></template>")]
        [InlineData(true, @"<template data-type=""traffic-light"" data-editable=""true""></template>")]
        public void Editable(bool editable, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateTrafficLight(null)
            {
                Editable = _ => editable
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the traffic light template control. The compact default is
        /// implied and therefore not emitted.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeTrafficLight.Default, @"<template data-type=""traffic-light""></template>")]
        [InlineData(TypeSizeTrafficLight.Small, @"<template data-type=""traffic-light"" data-size=""sm""></template>")]
        [InlineData(TypeSizeTrafficLight.ExtraLarge, @"<template data-type=""traffic-light"" data-size=""xl""></template>")]
        public void Size(TypeSizeTrafficLight size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateTrafficLight(null)
            {
                Size = _ => size
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the orientation property of the traffic light template control. The vertical
        /// default is implied and therefore not emitted.
        /// </summary>
        [Theory]
        [InlineData(TypeOrientationTrafficLight.Vertical, @"<template data-type=""traffic-light""></template>")]
        [InlineData(TypeOrientationTrafficLight.Horizontal, @"<template data-type=""traffic-light"" data-orientation=""horizontal""></template>")]
        public void Orientation(TypeOrientationTrafficLight orientation, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateTrafficLight(null)
            {
                Orientation = _ => orientation
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
