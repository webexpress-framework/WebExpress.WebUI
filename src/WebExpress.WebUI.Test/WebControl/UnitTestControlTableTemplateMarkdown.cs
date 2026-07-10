using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the markdown template control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableTemplateMarkdown
    {
        /// <summary>
        /// Tests the id property of the markdown template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""markdown""></template>")]
        [InlineData("id", @"<template id=""id"" data-type=""markdown""></template>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateMarkdown(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
