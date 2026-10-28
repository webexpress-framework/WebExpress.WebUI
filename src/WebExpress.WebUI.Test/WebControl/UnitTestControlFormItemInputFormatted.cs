using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the inputs of fixed notation that have no display of their own: the fully qualified
    /// domain name and the IP address.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputFormatted
    {
        /// <summary>
        /// Tests the rules of the host name input and the form the page receives.
        /// </summary>
        [Theory]
        [InlineData("Server.Example.com.", false, null, null, "server.example.com")]
        [InlineData("localhost", false, null, "webexpress.webui:form.inputfqdn.validation.invalid", "localhost")]
        [InlineData("*.example.com", true, null, null, "*.example.com")]
        [InlineData("server.example.org", false, "example.com", "webexpress.webui:form.inputfqdn.validation.domain", "server.example.org")]
        public void Fqdn(string posted, bool wildcard, string domain, string message, string value)
        {
            var control = new ControlFormItemInputFqdn("c")
            {
                Wildcard = _ => wildcard,
                Domains = domain is null ? null : _ => [domain]
            };

            Assert.Equal(message, FormInput.Validate(control, posted).SingleOrDefault()?.Text);
            Assert.Equal(value, FormInput.Value(control, posted));
        }

        /// <summary>
        /// Tests the rules of the IP input and the form the page receives.
        /// </summary>
        [Theory]
        [InlineData("2001:DB8:0:0::1", TypeIpVersion.Any, false, null, "2001:db8::1")]
        [InlineData("192.0.2.10", TypeIpVersion.Version6, false, "webexpress.webui:form.inputip.validation.version6", "192.0.2.10")]
        [InlineData("2001:db8::1", TypeIpVersion.Version4, false, "webexpress.webui:form.inputip.validation.version4", "2001:db8::1")]
        [InlineData("192.0.2.0/24", TypeIpVersion.Any, false, "webexpress.webui:form.inputip.validation.noprefix", "192.0.2.0/24")]
        [InlineData("192.0.2.0/24", TypeIpVersion.Version4, true, null, "192.0.2.0/24")]
        [InlineData("192.0.2.0/40", TypeIpVersion.Any, true, "webexpress.webui:form.inputip.validation.prefix", "192.0.2.0/40")]
        [InlineData("10.1", TypeIpVersion.Any, false, "webexpress.webui:form.inputip.validation.invalid", "10.1")]
        public void Ip(string posted, TypeIpVersion version, bool allowPrefix, string message, string value)
        {
            var control = new ControlFormItemInputIp("c")
            {
                Version = _ => version,
                AllowPrefix = _ => allowPrefix
            };

            Assert.Equal(message, FormInput.Validate(control, posted).SingleOrDefault()?.Text);
            Assert.Equal(value, FormInput.Value(control, posted));
        }
    }
}
