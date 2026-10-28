using System.Globalization;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the country control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlCountry
    {
        /// <summary>
        /// Tests that flag visibility reaches the client without changing the default markup.
        /// </summary>
        /// <param name="showFlag">The optional visibility setting.</param>
        [Theory]
        [InlineData(true)]
        [InlineData(false)]
        [InlineData(null)]
        public void ShowFlag(bool? showFlag)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCountry();
            Assert.True(control.ShowFlag(context));
            control.ShowFlag = showFlag.HasValue ? _ => showFlag.Value : null;

            // act
            var html = control.Render(context, visualTree);
            var flagAttribute = showFlag == false ? @" data-show-flag=""false""" : "";

            // validation
            AssertExtensions.EqualWithPlaceholders
            (
                @"<div class=""wx-webui-country""" + flagAttribute + "></div>",
                html
            );
        }

        /// <summary>
        /// Tests the id property of the country control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-country""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-country""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCountry(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the country travels as its upper-case code next to the name in the language
        /// of the request, whatever letter case it was given in, and that an unknown code renders
        /// an empty display.
        /// </summary>
        [Theory]
        [InlineData("en", "DE", @"<div class=""wx-webui-country"" data-value=""DE"">Germany</div>")]
        [InlineData("de-DE", "de", @"<div class=""wx-webui-country"" data-value=""DE"">Deutschland</div>")]
        [InlineData("de-DE", " fr ", @"<div class=""wx-webui-country"" data-value=""FR"">Frankreich</div>")]
        [InlineData("en", "XY", @"<div class=""wx-webui-country""></div>")]
        [InlineData("en", null, @"<div class=""wx-webui-country""></div>")]
        public void Country(string culture, string country, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock(CultureInfo.GetCultureInfo(culture));
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCountry(null)
            {
                Country = _ => country
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the show name property of the country control.
        /// </summary>
        [Theory]
        [InlineData(true, @"<div class=""wx-webui-country"" data-value=""JP"">Japan</div>")]
        [InlineData(false, @"<div class=""wx-webui-country"" data-value=""JP"" data-show-name=""false"">Japan</div>")]
        public void ShowName(bool showName, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCountry(null)
            {
                Country = _ => "JP",
                ShowName = _ => showName
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the catalog names every country it knows in both shipped languages, so no
        /// display falls back to a bare code.
        /// </summary>
        [Theory]
        [InlineData("en")]
        [InlineData("de-DE")]
        public void EveryCountryHasAName(string culture)
        {
            // arrange
            UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock(CultureInfo.GetCultureInfo(culture));

            // act
            var unnamed = CountryCatalog.Codes
                .Where(x => CountryCatalog.GetName(context, x) == x)
                .ToList();

            // validation
            Assert.Empty(unnamed);
        }

        /// <summary>
        /// Tests that every country of the catalog has a drawing among the shipped flags.
        /// </summary>
        [Fact]
        public void EveryCountryHasAFlag()
        {
            // arrange
            var assembly = typeof(CountryCatalog).Assembly;
            // the build names a resource below a folder with the separator of the build machine
            var resources = assembly.GetManifestResourceNames()
                .Select(x => x.Replace('\\', '.').Replace('/', '.'))
                .ToHashSet();

            // act
            var missing = CountryCatalog.Codes
                .Where(x => !resources.Contains($"WebExpress.WebUI.Assets.flags.{x.ToLowerInvariant()}.svg"))
                .ToList();

            // validation
            Assert.Equal(249, CountryCatalog.Codes.Count());
            Assert.Empty(missing);
        }
    }
}
