using System.Globalization;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the country template control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableTemplateCountry
    {
        /// <summary>
        /// Tests the id property of the country template control, and that a read-only template
        /// carries no country list, which only the picker needs.
        /// </summary>
        [Theory]
        [InlineData(null, @"<template data-type=""country""></template>")]
        [InlineData("id", @"<template id=""id"" data-type=""country""></template>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateCountry(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the template carries its settings and the restricted countries, named and
        /// sorted in the language of the request.
        /// </summary>
        [Fact]
        public void Options()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock(CultureInfo.GetCultureInfo("de-DE"));
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateCountry()
            {
                Editable = _ => true,
                MultiSelect = _ => true,
                ShowName = _ => false,
                Placeholder = _ => "Land",
                Countries = _ => ["fr", "DE"]
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders
            (
                @"<template data-type=""country"" data-multiselection=""true"" data-show-name=""false"" data-placeholder=""Land"" data-editable=""true"">" +
                @"<div id=""DE"" class=""wx-selection-item"" data-label=""Deutschland"" data-icon=""wx-flag wx-flag-de""></div>" +
                @"<div id=""FR"" class=""wx-selection-item"" data-label=""Frankreich"" data-icon=""wx-flag wx-flag-fr""></div>" +
                @"</template>",
                html
            );
        }
    }
}
