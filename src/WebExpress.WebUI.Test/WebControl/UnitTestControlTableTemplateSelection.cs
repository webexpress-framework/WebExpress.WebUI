using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the selection template control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableTemplateSelection
    {
        /// <summary>
        /// Tests the id property of the selection template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""selection""></template>")]
        [InlineData("id", @"<template id=""id"" data-type=""selection""></template>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateSelection(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the selection template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""selection""></template>")]
        [InlineData("abc", @"<template data-type=""selection"" data-placeholder=""abc""></template>")]
        [InlineData("webexpress.webui:plugin.name", @"<template data-type=""selection"" data-placeholder=""WebExpress.WebUI""></template>")]
        public void Placeholder(string placeholder, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateSelection(null)
            {
                Placeholder = placeholder
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the MultiSelect property of the form selection control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<template data-type=""selection""></template>")]
        [InlineData(true, @"<template data-type=""selection"" data-multiselection=""true""></template>")]
        public void MultiSelect(bool multiSelect, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateSelection(null)
            {
                MultiSelect = multiSelect
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
