using System.Globalization;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the phone display, its form input and its table template.
    /// </summary>
    public class UnitTestControlPhone
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
            var control = new ControlPhone();
            Assert.True(control.ShowFlag(context));
            control.ShowFlag = showFlag.HasValue ? _ => showFlag.Value : null;

            // act
            var html = control.Render(context, visualTree);
            var flagAttribute = showFlag == false ? @" data-show-flag=""false""" : "";

            // validation
            AssertExtensions.EqualWithPlaceholders
            (
                @"<div class=""wx-webui-phone""" + flagAttribute + "></div>",
                html
            );
        }

        /// <summary>
        /// Tests that the display carries the number in E.164 form and shows it with its calling
        /// code set apart, reading a national number in its country.
        /// </summary>
        [Theory]
        [InlineData("+49 30 123456", null, @"<div class=""wx-webui-phone"" data-value=""+4930123456"">+49 30123456</div>")]
        [InlineData("030 123456", "DE", @"<div class=""wx-webui-phone"" data-value=""+4930123456"">+49 30123456</div>")]
        [InlineData("030 123456", null, @"<div class=""wx-webui-phone""></div>")]
        public void Display(string phone, string country, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPhone() { Phone = _ => phone, Country = _ => country };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the input starts in the country of the request language, carries the number
        /// in E.164 form and offers the restricted countries, named in the request language.
        /// </summary>
        [Fact]
        public void Input()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(CultureInfo.GetCultureInfo("de-AT")), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputPhone("tel")
            {
                Phone = _ => "01 234567",
                Countries = _ => ["DE", "AT", "AQ"]
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders
            (
                @"<div id=""tel"" class=""wx-webui-input-phone"" name=""tel"" data-country=""AT"" data-value=""+431234567"">" +
                @"<div id=""DE"" class=""wx-selection-item"" data-label=""Deutschland"" data-icon=""wx-flag wx-flag-de""></div>" +
                @"<div id=""AT"" class=""wx-selection-item"" data-label=""Österreich"" data-icon=""wx-flag wx-flag-at""></div>" +
                @"</div>",
                html
            );
        }

        /// <summary>
        /// Tests the server rules of the input: the numbering plan and the offered countries.
        /// </summary>
        [Theory]
        [InlineData("+4930123456", true)]
        [InlineData("030 123456", true)]
        [InlineData("+49 12", false)]
        [InlineData("+33123456789", false)]
        [InlineData("call me", false)]
        public void Validate(string posted, bool valid)
        {
            var control = new ControlFormItemInputPhone("c") { Country = _ => "DE", Countries = _ => ["DE", "AT"] };

            Assert.Equal(valid, FormInput.Validate(control, posted).Count == 0);
        }

        /// <summary>
        /// Tests that a number of the offered country is taken although another country of its
        /// calling code claims overlapping patterns.
        /// </summary>
        [Theory]
        [InlineData("AU", "0412345678")]
        [InlineData("AU", "+61412345678")]
        [InlineData("CC", "+61412345678")]
        public void SharedCallingCode(string country, string posted)
        {
            var control = new ControlFormItemInputPhone("c") { Country = _ => country, Countries = _ => [country] };

            Assert.Equal("+61412345678", FormInput.Value(control, posted));
            Assert.Empty(FormInput.Validate(control, posted));
        }

        /// <summary>
        /// Tests that the posted number reaches the page in E.164 form.
        /// </summary>
        [Fact]
        public void Process()
        {
            Assert.Equal("+4930123456", FormInput.Value(new ControlFormItemInputPhone("c") { Country = _ => "DE" }, "030 / 123 456"));
        }

        /// <summary>
        /// Tests the table template.
        /// </summary>
        [Theory]
        [InlineData(false, null, @"<template data-type=""phone""></template>")]
        [InlineData(true, "ch", @"<template data-type=""phone"" data-country=""CH"" data-editable=""true""></template>")]
        public void Template(bool editable, string country, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplatePhone() { Editable = _ => editable, Country = _ => country };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
