using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the e-mail display, its form input and its table template.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlEmail
    {
        /// <summary>
        /// Tests that the display carries the normalized address and that an invalid one renders empty.
        /// </summary>
        [Theory]
        [InlineData(null, "Grace@Example.com", @"<div class=""wx-webui-email"" data-value=""Grace@example.com"">Grace@example.com</div>")]
        [InlineData("id", "no address", @"<div id=""id"" class=""wx-webui-email""></div>")]
        public void Display(string id, string email, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlEmail(id) { Email = _ => email };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the input is a native e-mail field the browser can fill.
        /// </summary>
        [Fact]
        public void Input()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputEmail("mail") { Placeholder = _ => "name@example.com" };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"type=""email""", html);
            Assert.Contains(@"autocomplete=""email""", html);
            Assert.Contains(@"name=""mail""", html);
            Assert.Contains(@"placeholder=""name@example.com""", html);
        }

        /// <summary>
        /// Tests the server rules of the input: the notation and the permitted domains.
        /// </summary>
        [Theory]
        [InlineData("grace@example.com", null, true)]
        [InlineData("grace@", null, false)]
        [InlineData("grace@mail.example.com", "example.com", true)]
        [InlineData("grace@example.org", "example.com", false)]
        public void Validate(string posted, string domain, bool valid)
        {
            var control = new ControlFormItemInputEmail("c") { Domains = domain is null ? null : _ => [domain] };

            Assert.Equal(valid, FormInput.Validate(control, posted).Count == 0);
        }

        /// <summary>
        /// Tests that the posted address reaches the page in its normalized form.
        /// </summary>
        [Fact]
        public void Process()
        {
            Assert.Equal("Grace@example.com", FormInput.Value(new ControlFormItemInputEmail("c"), " Grace@EXAMPLE.com "));
        }

        /// <summary>
        /// Tests the table template.
        /// </summary>
        [Theory]
        [InlineData(false, @"<template data-type=""email""></template>")]
        [InlineData(true, @"<template data-type=""email"" data-editable=""true""></template>")]
        public void Template(bool editable, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateEmail() { Editable = _ => editable };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
