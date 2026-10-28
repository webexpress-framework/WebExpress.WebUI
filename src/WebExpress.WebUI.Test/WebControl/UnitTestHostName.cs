using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the rules of fully qualified domain names.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestHostName
    {
        /// <summary>
        /// Tests that a name is stored in lower case without its root dot, an internationalized
        /// one in Unicode, and that a single label, an address or a broken label is refused.
        /// </summary>
        [Theory]
        [InlineData("Server01.Example.COM.", false, "server01.example.com")]
        [InlineData("BÜCHER.de", false, "bücher.de")]
        [InlineData("xn--bcher-kva.de", false, "bücher.de")]
        [InlineData("*.example.com", true, "*.example.com")]
        [InlineData("*.example.com", false, null)]
        [InlineData("localhost", false, null)]
        [InlineData("192.0.2.10", false, null)]
        [InlineData("-bad.example.com", false, null)]
        [InlineData("bad-.example.com", false, null)]
        [InlineData("under_score.example.com", false, null)]
        [InlineData("a..example.com", false, null)]
        [InlineData("", false, null)]
        public void Normalize(string value, bool wildcard, string expected)
        {
            Assert.Equal(expected, HostName.Normalize(value, wildcard));
        }

        /// <summary>
        /// Tests the limits of a label and of the whole name.
        /// </summary>
        [Fact]
        public void Limits()
        {
            Assert.True(HostName.IsValid(new string('a', 63) + ".example.com"));
            Assert.False(HostName.IsValid(new string('a', 64) + ".example.com"));
            Assert.False(HostName.IsValid(string.Join(".", Enumerable.Repeat(new string('a', 60), 5)) + ".com"));
        }

        /// <summary>
        /// Tests that a name lies within its domain and the domain itself, and not within a look-alike.
        /// </summary>
        [Theory]
        [InlineData("server.example.com", "example.com", true)]
        [InlineData("example.com", "example.com", true)]
        [InlineData("*.example.com", "example.com", true)]
        [InlineData("server.badexample.com", "example.com", false)]
        public void IsInDomain(string value, string domain, bool expected)
        {
            Assert.Equal(expected, HostName.IsInDomain(value, domain));
        }
    }
}
