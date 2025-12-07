using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the date template control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableTemplateDate
    {
        /// <summary>
        /// Tests the id property of the date template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""date""></template>")]
        [InlineData("id", @"<template id=""id"" data-type=""date""></template>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateDate(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the date template control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorDate.Default, @"<template data-type=""date""></template>")]
        [InlineData(TypeColorDate.Primary, @"<template data-type=""date"" data-color-css=""bg-primary""></template>")]
        [InlineData(TypeColorDate.Secondary, @"<template data-type=""date"" data-color-css=""bg-secondary""></template>")]
        [InlineData(TypeColorDate.Info, @"<template data-type=""date"" data-color-css=""bg-info""></template>")]
        [InlineData(TypeColorDate.Success, @"<template data-type=""date"" data-color-css=""bg-success""></template>")]
        [InlineData(TypeColorDate.Warning, @"<template data-type=""date"" data-color-css=""bg-warning""></template>")]
        [InlineData(TypeColorDate.Danger, @"<template data-type=""date"" data-color-css=""bg-danger""></template>")]
        [InlineData(TypeColorDate.Light, @"<template data-type=""date"" data-color-css=""bg-light""></template>")]
        [InlineData(TypeColorDate.Dark, @"<template data-type=""date"" data-color-css=""bg-dark""></template>")]
        public void SystemColor(TypeColorDate color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateDate()
            {
                Color = new PropertyColorDate(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the date template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""date""></template>")]
        [InlineData("", @"<template data-type=""date""></template>")]
        [InlineData(" ", @"<template data-type=""date""></template>")]
        [InlineData("gold", @"<template data-type=""date"" data-color-style=""background: gold;""></template>")]
        public void UserColor(string color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateDate()
            {
                Color = new PropertyColorDate(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the date template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""date""></template>")]
        [InlineData("abc", @"<template data-type=""date"" data-placeholder=""abc""></template>")]
        [InlineData("webexpress.webui:plugin.name", @"<template data-type=""date"" data-placeholder=""WebExpress.WebUI""></template>")]
        public void Placeholder(string placeholder, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateDate(null)
            {
                Placeholder = placeholder
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the format property of the date template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""date""></template>")]
        [InlineData("abc", @"<template data-type=""date"" data-format=""abc""></template>")]
        public void Format(string format, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateDate(null)
            {
                Format = format
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
