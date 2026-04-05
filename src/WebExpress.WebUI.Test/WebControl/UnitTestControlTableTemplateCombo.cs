using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the combo template control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableTemplateCombo
    {
        /// <summary>
        /// Tests the id property of the combo template control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""combo""></template>")]
        [InlineData("id", @"<template id=""id"" data-type=""combo""></template>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateCombo(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the MultiSelect property of the form combo control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<template data-type=""combo""></template>")]
        [InlineData(true, @"<template data-type=""combo"" data-multiselection=""true""></template>")]
        public void MultiSelect(bool multiSelect, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateCombo(null)
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
