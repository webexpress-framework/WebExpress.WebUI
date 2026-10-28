using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the IP address rules.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestIpAddress
    {
        /// <summary>
        /// Tests that an address of either version is stored in one spelling, and that the
        /// lenient forms the runtime would read are refused.
        /// </summary>
        [Theory]
        [InlineData(" 192.0.2.10 ", "192.0.2.10")]
        [InlineData("2001:0DB8:0000:0000:0000:0000:0000:0001", "2001:db8::1")]
        [InlineData("::ffff:192.0.2.10", "::ffff:192.0.2.10")]
        [InlineData("10.1", null)]
        [InlineData("192.168.001.1", null)]
        [InlineData("256.0.0.1", null)]
        [InlineData("fe80::1%eth0", null)]
        [InlineData("2001:db8::1::2", null)]
        [InlineData("server.example.com", null)]
        [InlineData("\u0661\u0669\u0662.0.2.10", null)]
        [InlineData("", null)]
        public void Normalize(string value, string expected)
        {
            Assert.Equal(expected, IpAddress.Normalize(value));
        }

        /// <summary>
        /// Tests the version and prefix rules and what is reported for each.
        /// </summary>
        [Theory]
        [InlineData("192.0.2.10", TypeIpVersion.Version4, false, IpAddressError.None)]
        [InlineData("2001:db8::1", TypeIpVersion.Version4, false, IpAddressError.NotVersion4)]
        [InlineData("192.0.2.10", TypeIpVersion.Version6, false, IpAddressError.NotVersion6)]
        [InlineData("192.0.2.0/24", TypeIpVersion.Any, true, IpAddressError.None)]
        [InlineData("192.0.2.0/24", TypeIpVersion.Any, false, IpAddressError.PrefixNotAllowed)]
        [InlineData("192.0.2.0/33", TypeIpVersion.Any, true, IpAddressError.Prefix)]
        [InlineData("2001:db8::/128", TypeIpVersion.Any, true, IpAddressError.None)]
        [InlineData("2001:db8::/129", TypeIpVersion.Any, true, IpAddressError.Prefix)]
        [InlineData("192.0.2.0/024", TypeIpVersion.Any, true, IpAddressError.Prefix)]
        [InlineData("192.0.2.0/\u0662\u0664", TypeIpVersion.Any, true, IpAddressError.Prefix)]
        [InlineData("nonsense", TypeIpVersion.Any, true, IpAddressError.Invalid)]
        public void Check(string value, TypeIpVersion version, bool allowPrefix, IpAddressError expected)
        {
            Assert.Equal(expected, IpAddress.Check(value, version, allowPrefix, out _));
        }
    }
}
