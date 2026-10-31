using System.Globalization;
using WebExpress.WebCore.WebParameter;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form country control.
    /// </summary>
    public class UnitTestControlFormItemInputCountry
    {
        /// <summary>
        /// Tests that the host is a selection the client builds the field from, named after its id.
        /// </summary>
        [Theory]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-input-selection wx-country-input"" name=""id"">*</div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCountry(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the offered countries are restricted, named in the language of the request,
        /// sorted by that name and drawn with their flag.
        /// </summary>
        [Fact]
        public void Countries()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(CultureInfo.GetCultureInfo("de-DE")), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCountry("c")
            {
                Countries = _ => ["fr", "AT", "XY", "DE"]
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders
            (
                @"<div id=""c"" class=""wx-webui-input-selection wx-country-input"" name=""c"">" +
                @"<div id=""DE"" class=""wx-selection-item"" data-label=""Deutschland"" data-icon=""wx-flag wx-flag-de""></div>" +
                @"<div id=""FR"" class=""wx-selection-item"" data-label=""Frankreich"" data-icon=""wx-flag wx-flag-fr""></div>" +
                @"<div id=""AT"" class=""wx-selection-item"" data-label=""Österreich"" data-icon=""wx-flag wx-flag-at""></div>" +
                @"</div>",
                html
            );
        }

        /// <summary>
        /// Tests that the preset country is chosen in its upper-case form and that an unknown one is dropped.
        /// </summary>
        [Theory]
        [InlineData("de", @"*data-value=""DE""*")]
        [InlineData("de;fr", @"*data-value=""DE;FR""*")]
        [InlineData("xy", @"<div id=""c"" class=""wx-webui-input-selection wx-country-input"" name=""c""><div id=""AT""*")]
        public void Country(string country, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCountry("c")
            {
                Country = _ => country,
                Countries = _ => ["AT", "DE", "FR"]
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that a posted code must name an offered country, and that several codes are only
        /// taken where several countries may be chosen.
        /// </summary>
        [Theory]
        [InlineData("DE", false, true)]
        [InlineData("de", false, true)]
        [InlineData("XY", false, false)]
        [InlineData("US", false, false)]
        [InlineData("DE;FR", false, false)]
        [InlineData("DE;FR", true, true)]
        [InlineData("DE;XY", true, false)]
        public void Validate(string posted, bool multiSelect, bool valid)
        {
            // arrange
            UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock
            (
                null,
                null,
                new Parameter("c", posted, ParameterScope.Parameter)
            ), form);
            var control = new ControlFormItemInputCountry("c")
            {
                Countries = _ => ["DE", "FR", "AT"],
                MultiSelect = _ => multiSelect
            };
            control.Initialize(context);

            // act
            var results = control.Validate(context).ToList();

            // validation
            Assert.Equal(valid, results.Count == 0);
        }

        /// <summary>
        /// Tests that a posted list naming no country counts as missing in a required field.
        /// </summary>
        [Theory]
        [InlineData(";")]
        [InlineData(" ; ;")]
        public void RequiredRefusesAnEmptyList(string posted)
        {
            var control = new ControlFormItemInputCountry("c") { Required = _ => true };

            Assert.Single(FormInput.Validate(control, posted));
        }
    }
}
