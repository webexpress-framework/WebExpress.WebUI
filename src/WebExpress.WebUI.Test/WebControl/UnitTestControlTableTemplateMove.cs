using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the move template control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableTemplateMove
    {
        /// <summary>
        /// Tests the id property of the move template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""move""></template>")]
        [InlineData("id", @"<template id=""id"" data-type=""move""></template>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateMove(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
