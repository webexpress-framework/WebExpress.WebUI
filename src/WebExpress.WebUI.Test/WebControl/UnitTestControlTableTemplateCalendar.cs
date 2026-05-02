using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the calendar template control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableTemplateCalendar
    {
        /// <summary>
        /// Tests the id property of the calendar template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""calendar""></template>")]
        [InlineData("id", @"<template id=""id"" data-type=""calendar""></template>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateCalendar(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the calendar template control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorDate.Default, @"<template data-type=""calendar""></template>")]
        [InlineData(TypeColorDate.Primary, @"<template data-type=""calendar"" data-color-css=""bg-primary""></template>")]
        [InlineData(TypeColorDate.Secondary, @"<template data-type=""calendar"" data-color-css=""bg-secondary""></template>")]
        [InlineData(TypeColorDate.Info, @"<template data-type=""calendar"" data-color-css=""bg-info""></template>")]
        [InlineData(TypeColorDate.Success, @"<template data-type=""calendar"" data-color-css=""bg-success""></template>")]
        [InlineData(TypeColorDate.Warning, @"<template data-type=""calendar"" data-color-css=""bg-warning""></template>")]
        [InlineData(TypeColorDate.Danger, @"<template data-type=""calendar"" data-color-css=""bg-danger""></template>")]
        [InlineData(TypeColorDate.Light, @"<template data-type=""calendar"" data-color-css=""bg-light""></template>")]
        [InlineData(TypeColorDate.Highlight, @"<template data-type=""calendar"" data-color-css=""bg-highlight""></template>")]
        [InlineData(TypeColorDate.Dark, @"<template data-type=""calendar"" data-color-css=""bg-dark""></template>")]
        public void SystemColor(TypeColorDate color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateCalendar()
            {
                Color = new PropertyColorDate(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the calendar template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""calendar""></template>")]
        [InlineData("", @"<template data-type=""calendar""></template>")]
        [InlineData(" ", @"<template data-type=""calendar""></template>")]
        [InlineData("gold", @"<template data-type=""calendar"" data-color-style=""background: gold;""></template>")]
        public void UserColor(string color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateCalendar()
            {
                Color = new PropertyColorDate(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the calendar template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""calendar""></template>")]
        [InlineData("abc", @"<template data-type=""calendar"" data-placeholder=""abc""></template>")]
        [InlineData("webexpress.webui:plugin.name", @"<template data-type=""calendar"" data-placeholder=""WebExpress.WebUI""></template>")]
        public void Placeholder(string placeholder, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateCalendar(null)
            {
                Placeholder = placeholder
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the format property of the calendar template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""calendar""></template>")]
        [InlineData("abc", @"<template data-type=""calendar"" data-format=""abc""></template>")]
        public void Format(string format, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateCalendar(null)
            {
                Format = format
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
