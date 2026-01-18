using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the tag template control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableTemplateTag
    {
        /// <summary>
        /// Tests the id property of the tag template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""tag""></template>")]
        [InlineData("id", @"<template id=""id"" data-type=""tag""></template>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateTag(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the tag template control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorTag.Default, @"<template data-type=""tag""></template>")]
        [InlineData(TypeColorTag.Primary, @"<template data-type=""tag"" data-color-css=""wx-tag-primary""></template>")]
        [InlineData(TypeColorTag.Secondary, @"<template data-type=""tag"" data-color-css=""wx-tag-secondary""></template>")]
        [InlineData(TypeColorTag.Info, @"<template data-type=""tag"" data-color-css=""wx-tag-info""></template>")]
        [InlineData(TypeColorTag.Success, @"<template data-type=""tag"" data-color-css=""wx-tag-success""></template>")]
        [InlineData(TypeColorTag.Warning, @"<template data-type=""tag"" data-color-css=""wx-tag-warning""></template>")]
        [InlineData(TypeColorTag.Danger, @"<template data-type=""tag"" data-color-css=""wx-tag-danger""></template>")]
        [InlineData(TypeColorTag.Light, @"<template data-type=""tag"" data-color-css=""wx-tag-light""></template>")]
        [InlineData(TypeColorTag.Dark, @"<template data-type=""tag"" data-color-css=""wx-tag-dark""></template>")]
        public void SystemColor(TypeColorTag color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateTag()
            {
                Color = new PropertyColorTag(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the tag template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""tag""></template>")]
        [InlineData("", @"<template data-type=""tag""></template>")]
        [InlineData(" ", @"<template data-type=""tag""></template>")]
        [InlineData("gold", @"<template data-type=""tag"" data-color-style=""background: gold;""></template>")]
        public void UserColor(string color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateTag()
            {
                Color = new PropertyColorTag(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the tag template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""tag""></template>")]
        [InlineData("abc", @"<template data-type=""tag"" data-placeholder=""abc""></template>")]
        [InlineData("webexpress.webui:plugin.name", @"<template data-type=""tag"" data-placeholder=""WebExpress.WebUI""></template>")]
        public void Placeholder(string placeholder, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateTag(null)
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
