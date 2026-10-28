using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the domain input: the picker of the offered domains beside the user name, and the
    /// plain text field it falls back to without domains.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputDomain
    {
        /// <summary>
        /// Tests that the host carries the offered domains, the start domain, the notation and the
        /// account, so the client can build the picker.
        /// </summary>
        [Fact]
        public void RenderWithDomains()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputDomain("account")
            {
                Domains = _ => ["CONTOSO", "fabrikam", "Contoso"],
                Domain = _ => "Fabrikam",
                Format = _ => TypeDomainFormat.DownLevel,
                Account = _ => "jdoe"
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders
            (
                @"<div id=""account"" class=""wx-webui-input-domain"" name=""account"" placeholder=""User name"" data-format=""downlevel"" data-domain=""fabrikam"" data-value=""fabrikam\jdoe"">" +
                @"<div id=""CONTOSO"" class=""wx-selection-item"" data-label=""CONTOSO""></div>" +
                @"<div id=""fabrikam"" class=""wx-selection-item"" data-label=""fabrikam""></div>" +
                @"</div>",
                html
            );
        }

        /// <summary>
        /// Tests that without domains the field is a text field showing an example of the notation.
        /// </summary>
        [Theory]
        [InlineData(TypeDomainFormat.Any, @"DOMAIN\user or user@domain.com")]
        [InlineData(TypeDomainFormat.Principal, @"user@domain.com")]
        public void RenderWithoutDomains(TypeDomainFormat format, string placeholder)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputDomain("account") { Format = _ => format };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains($@"placeholder=""{placeholder}""", html);
            Assert.DoesNotContain("data-domain", html);
            Assert.DoesNotContain("wx-selection-item", html);
        }

        /// <summary>
        /// Tests the server rules: notation, format and the offered domains.
        /// </summary>
        [Theory]
        [InlineData("CONTOSO\\jdoe", TypeDomainFormat.Any, null, null)]
        [InlineData("jdoe@contoso.com", TypeDomainFormat.DownLevel, null, "webexpress.webui:form.inputdomain.validation.downlevel")]
        [InlineData("CONTOSO\\jdoe", TypeDomainFormat.Principal, null, "webexpress.webui:form.inputdomain.validation.principal")]
        [InlineData("OTHER\\jdoe", TypeDomainFormat.Any, "contoso", "webexpress.webui:form.inputdomain.validation.domain")]
        [InlineData("contoso\\jdoe", TypeDomainFormat.Any, "CONTOSO", null)]
        [InlineData("CONTOSO\\j[doe]", TypeDomainFormat.Any, null, "webexpress.webui:form.inputdomain.validation.invalid")]
        public void Validate(string posted, TypeDomainFormat format, string domain, string message)
        {
            var control = new ControlFormItemInputDomain("c")
            {
                Format = _ => format,
                Domains = domain is null ? null : _ => [domain]
            };

            Assert.Equal(message, FormInput.Validate(control, posted).SingleOrDefault()?.Text);
        }

        /// <summary>
        /// Tests that a bare user name reaches the page completed with the start domain: the
        /// configured one without a picker, the first offered one with it.
        /// </summary>
        [Theory]
        [InlineData("CONTOSO", null, "CONTOSO\\jdoe")]
        [InlineData("contoso.com", null, "jdoe@contoso.com")]
        [InlineData(null, "FABRIKAM", "FABRIKAM\\jdoe")]
        public void Completion(string start, string offered, string expected)
        {
            var control = new ControlFormItemInputDomain("c")
            {
                Domain = start is null ? null : _ => start,
                Domains = offered is null ? null : _ => [offered]
            };

            Assert.Equal(expected, FormInput.Value(control, "jdoe"));
            Assert.Empty(FormInput.Validate(control, "jdoe"));
        }
    }
}
