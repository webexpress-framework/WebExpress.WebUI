using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the domain account rules.
    /// </summary>
    public class UnitTestDomainLogon
    {
        /// <summary>
        /// Tests which names the directory would take, in both notations.
        /// </summary>
        [Theory]
        [InlineData("CONTOSO\\jdoe", true, TypeDomainFormat.DownLevel, "CONTOSO", "jdoe")]
        [InlineData("contoso.com\\jdoe", true, TypeDomainFormat.DownLevel, "contoso.com", "jdoe")]
        [InlineData("jdoe@contoso.com", true, TypeDomainFormat.Principal, "contoso.com", "jdoe")]
        [InlineData("j.doe@corp.contoso.local", true, TypeDomainFormat.Principal, "corp.contoso.local", "j.doe")]
        [InlineData("ABCDEFGHIJKLMNOP\\jdoe", false, TypeDomainFormat.DownLevel, null, null)]
        [InlineData("CONTOSO\\abcdefghijklmnopqrstu", false, TypeDomainFormat.DownLevel, null, null)]
        [InlineData("CONTOSO\\j[doe]", false, TypeDomainFormat.DownLevel, null, null)]
        [InlineData("CONTOSO\\jdoe.", false, TypeDomainFormat.DownLevel, null, null)]
        [InlineData("\\jdoe", false, TypeDomainFormat.DownLevel, null, null)]
        [InlineData("jdoe@contoso_com", false, TypeDomainFormat.Principal, null, null)]
        [InlineData("jdoe", false, TypeDomainFormat.Any, null, null)]
        public void TryParse(string value, bool valid, TypeDomainFormat format, string domain, string user)
        {
            Assert.Equal(valid, DomainLogon.TryParse(value, out var parsedDomain, out var parsedUser, out var parsedFormat));
            Assert.Equal(format, parsedFormat);
            if (valid)
            {
                Assert.Equal(domain, parsedDomain);
                Assert.Equal(user, parsedUser);
            }
        }

        /// <summary>
        /// Tests that a bare user name is completed in the notation its default domain suggests.
        /// </summary>
        [Theory]
        [InlineData(" jdoe ", "CONTOSO", "CONTOSO\\jdoe")]
        [InlineData("jdoe", "contoso.com", "jdoe@contoso.com")]
        [InlineData("OTHER\\jdoe", "CONTOSO", "OTHER\\jdoe")]
        [InlineData("jdoe", null, null)]
        public void Normalize(string value, string defaultDomain, string expected)
        {
            Assert.Equal(expected, DomainLogon.Normalize(value, defaultDomain));
        }
    }
}
