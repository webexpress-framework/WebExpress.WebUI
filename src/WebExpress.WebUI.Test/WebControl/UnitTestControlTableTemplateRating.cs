using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the rating template control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableTemplateRating
    {
        /// <summary>
        /// Tests the id property of the rating template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""rating""></template>")]
        [InlineData("id", @"<template id=""id"" data-type=""rating""></template>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateRating(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the max rating property of the rating template control.
        /// </summary>
        [Theory]
        [InlineData(uint.MaxValue, @"<template data-type=""rating""></template>")]
        [InlineData(5, @"<template data-type=""rating"" data-stars=""5""></template>")]
        public void MaxRating(uint value, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateRating(null)
            {
                MaxRating = value
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
