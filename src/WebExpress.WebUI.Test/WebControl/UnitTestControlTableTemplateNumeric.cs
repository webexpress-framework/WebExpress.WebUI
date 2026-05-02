using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the numeric template control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableTemplateNumeric
    {
        /// <summary>
        /// Tests the id property of the numeric template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""numeric""></template>")]
        [InlineData("id", @"<template id=""id"" data-type=""numeric""></template>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateNumeric(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the numeric template control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<template data-type=""numeric""></template>")]
        [InlineData(TypeColorText.Primary, @"<template data-type=""numeric"" data-color-css=""text-primary""></template>")]
        [InlineData(TypeColorText.Secondary, @"<template data-type=""numeric"" data-color-css=""text-secondary""></template>")]
        [InlineData(TypeColorText.Info, @"<template data-type=""numeric"" data-color-css=""text-info""></template>")]
        [InlineData(TypeColorText.Success, @"<template data-type=""numeric"" data-color-css=""text-success""></template>")]
        [InlineData(TypeColorText.Warning, @"<template data-type=""numeric"" data-color-css=""text-warning""></template>")]
        [InlineData(TypeColorText.Danger, @"<template data-type=""numeric"" data-color-css=""text-danger""></template>")]
        [InlineData(TypeColorText.Light, @"<template data-type=""numeric"" data-color-css=""text-light""></template>")]
        [InlineData(TypeColorText.Highlight, @"<template data-type=""numeric"" data-color-css=""text-highlight""></template>")]
        [InlineData(TypeColorText.Dark, @"<template data-type=""numeric"" data-color-css=""text-dark""></template>")]
        public void SystemColor(TypeColorText color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateNumeric()
            {
                Color = new PropertyColorText(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the numeric template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""numeric""></template>")]
        [InlineData("", @"<template data-type=""numeric""></template>")]
        [InlineData(" ", @"<template data-type=""numeric""></template>")]
        [InlineData("gold", @"<template data-type=""numeric"" data-color-style=""color:gold;""></template>")]
        public void UserColor(string color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateNumeric()
            {
                Color = new PropertyColorText(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the numeric template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""numeric""></template>")]
        [InlineData("abc", @"<template data-type=""numeric"" data-placeholder=""abc""></template>")]
        [InlineData("webexpress.webui:plugin.name", @"<template data-type=""numeric"" data-placeholder=""WebExpress.WebUI""></template>")]
        public void Placeholder(string placeholder, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateNumeric(null)
            {
                Placeholder = placeholder
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
