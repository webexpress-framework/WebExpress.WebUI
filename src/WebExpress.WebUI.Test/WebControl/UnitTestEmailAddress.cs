using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the e-mail address rules.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestEmailAddress
    {
        /// <summary>
        /// Tests that an address keeps its local part and gets its domain in lower case, and that
        /// a text breaking the browser's rule is refused.
        /// </summary>
        [Theory]
        [InlineData(" Grace.Hopper@Example.COM ", "Grace.Hopper@example.com")]
        [InlineData("a+tag@mail.example.org", "a+tag@mail.example.org")]
        [InlineData("user@localhost", "user@localhost")]
        [InlineData("user@", null)]
        [InlineData("@example.com", null)]
        [InlineData("two@at@example.com", null)]
        [InlineData("user@-example.com", null)]
        [InlineData("user name@example.com", null)]
        [InlineData("", null)]
        public void Normalize(string value, string expected)
        {
            Assert.Equal(expected, EmailAddress.Normalize(value));
        }

        /// <summary>
        /// Tests that a local part longer than the limit of RFC 5321 is refused.
        /// </summary>
        [Fact]
        public void LocalPartLimit()
        {
            Assert.True(EmailAddress.IsValid(new string('a', 64) + "@example.com"));
            Assert.False(EmailAddress.IsValid(new string('a', 65) + "@example.com"));
        }

        /// <summary>
        /// Tests that an address belongs to its domain and the sub-domains of it, and to no other.
        /// </summary>
        [Theory]
        [InlineData("a@example.com", "example.com", true)]
        [InlineData("a@mail.example.com", "Example.com", true)]
        [InlineData("a@example.com", "@example.com", true)]
        [InlineData("a@badexample.com", "example.com", false)]
        [InlineData("a@example.org", "example.com", false)]
        public void IsInDomain(string value, string domain, bool expected)
        {
            Assert.Equal(expected, EmailAddress.IsInDomain(value, domain));
        }
    }
}
