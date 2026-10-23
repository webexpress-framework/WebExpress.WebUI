using System.Globalization;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the date control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlDate
    {
        /// <summary>
        /// Tests the id property of the avatar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-date"" data-format=""yyyy-MM-dd""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-date"" data-format=""yyyy-MM-dd""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDate(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the format property of the date control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-date""></div>")]
        [InlineData("yyyy-mm-dd", @"<div class=""wx-webui-date"" data-format=""yyyy-mm-dd""></div>")]
        public void Format(string format, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDate(null)
            {
                Format = _ => format
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the format property of the date control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-date"" data-format=""yyyy-MM-dd""></div>")]
        [InlineData("", @"<div class=""wx-webui-date"" data-format=""yyyy-MM-dd""></div>")]
        public void Date(string date, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDate(null)
            {
                Date = _ => string.IsNullOrWhiteSpace(date) ? default : DateTime.Parse(date)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that a set date travels culture-neutral next to the culture-formatted text, so the
        /// client does not have to parse a format it may not understand.
        /// </summary>
        [Theory]
        [InlineData("yyyy-MM-dd", @"<div class=""wx-webui-date"" data-format=""yyyy-MM-dd"" data-value=""2026-10-03"">2026-10-03</div>")]
        [InlineData("dd. MMMM yyyy", @"<div class=""wx-webui-date"" data-format=""dd. MMMM yyyy"" data-value=""2026-10-03"">03. Oktober 2026</div>")]
        public void DateValue(string format, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock(CultureInfo.GetCultureInfo("de-DE"));
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDate(null)
            {
                Format = _ => format,
                Date = _ => new DateTime(2026, 10, 3)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the inherited styling properties of the control reach the rendered element.
        /// </summary>
        [Fact]
        public void Styling()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDate(null)
            {
                Classes = ["my-date"],
                Styles = ["width: 10rem;"],
                Role = _ => "note"
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-date my-date"" style=""width: 10rem;"" role=""note"" data-format=""yyyy-MM-dd""></div>", html);
        }

        /// <summary>
        /// Tests the color property of the date control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorDate.Default, @"<div class=""wx-webui-date"" data-format=""yyyy-MM-dd""></div>")]
        [InlineData(TypeColorDate.Primary, @"<div class=""wx-webui-date"" data-color-css=""bg-primary"" data-format=""yyyy-MM-dd""></div>")]
        [InlineData(TypeColorDate.Secondary, @"<div class=""wx-webui-date"" data-color-css=""bg-secondary"" data-format=""yyyy-MM-dd""></div>")]
        [InlineData(TypeColorDate.Info, @"<div class=""wx-webui-date"" data-color-css=""bg-info"" data-format=""yyyy-MM-dd""></div>")]
        [InlineData(TypeColorDate.Success, @"<div class=""wx-webui-date"" data-color-css=""bg-success"" data-format=""yyyy-MM-dd""></div>")]
        [InlineData(TypeColorDate.Warning, @"<div class=""wx-webui-date"" data-color-css=""bg-warning"" data-format=""yyyy-MM-dd""></div>")]
        [InlineData(TypeColorDate.Danger, @"<div class=""wx-webui-date"" data-color-css=""bg-danger"" data-format=""yyyy-MM-dd""></div>")]
        [InlineData(TypeColorDate.Light, @"<div class=""wx-webui-date"" data-color-css=""bg-light"" data-format=""yyyy-MM-dd""></div>")]
        [InlineData(TypeColorDate.Highlight, @"<div class=""wx-webui-date"" data-color-css=""bg-highlight"" data-format=""yyyy-MM-dd""></div>")]
        [InlineData(TypeColorDate.Dark, @"<div class=""wx-webui-date"" data-color-css=""bg-dark"" data-format=""yyyy-MM-dd""></div>")]
        public void SystemColor(TypeColorDate color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDate()
            {
                Color = _ => new PropertyColorDate(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the date control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-date"" data-format=""yyyy-MM-dd""></div>")]
        [InlineData("", @"<div class=""wx-webui-date"" data-format=""yyyy-MM-dd""></div>")]
        [InlineData(" ", @"<div class=""wx-webui-date"" data-format=""yyyy-MM-dd""></div>")]
        [InlineData("gold", @"<div class=""wx-webui-date"" data-color-style=""background: gold;color: #000;"" data-format=""yyyy-MM-dd""></div>")]
        public void UserColor(string color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDate()
            {
                Color = _ => new PropertyColorDate(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
