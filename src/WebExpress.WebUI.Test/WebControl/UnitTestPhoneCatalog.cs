using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the numbering plans of the phone catalog.
    /// </summary>
    public class UnitTestPhoneCatalog
    {
        /// <summary>
        /// Tests that numbers in the usual notations come out in E.164 form, a national one read in
        /// its country without the national prefix, and that a number off its plan is refused.
        /// </summary>
        [Theory]
        [InlineData("+49 30 123456", null, "+4930123456")]
        [InlineData("0049 (30) 123-456", null, "+4930123456")]
        [InlineData("030 123456", "DE", "+4930123456")]
        [InlineData("030 123456", "de", "+4930123456")]
        [InlineData("(212) 555-1234", "US", "+12125551234")]
        [InlineData("06 12345678", "IT", "+390612345678")]
        [InlineData("030 123456", null, null)]
        [InlineData("+49 12", null, null)]
        [InlineData("+999 1234567", null, null)]
        [InlineData("+49 30 12a456", null, null)]
        [InlineData("", "DE", null)]
        public void Normalize(string value, string country, string expected)
        {
            Assert.Equal(expected, PhoneCatalog.Normalize(value, country));
        }

        /// <summary>
        /// Tests that a country sharing its calling code is told apart from the fallback of the code.
        /// </summary>
        [Theory]
        [InlineData("+12125551234", "US")]
        [InlineData("+14165551234", "CA")]
        [InlineData("+12425551234", "BS")]
        [InlineData("+447700900123", "GB")]
        [InlineData("+441481256789", "GG")]
        [InlineData("+77012345678", "KZ")]
        [InlineData("+61412345678", "AU")]
        [InlineData("+61891621234", "CC")]
        [InlineData("+4930123456", "DE")]
        [InlineData("030123456", null)]
        public void GetCountry(string value, string expected)
        {
            Assert.Equal(expected, PhoneCatalog.GetCountry(value));
        }

        /// <summary>
        /// Tests that a number fits every country of its calling code whose plan claims it, not
        /// only the one detected: an australian mobile number is the Cocos Islands' as well.
        /// </summary>
        [Theory]
        [InlineData("+61412345678", "AU", true)]
        [InlineData("+61412345678", "CC", true)]
        [InlineData("+61891621234", "AU", true)]
        [InlineData("+12125551234", "CA", false)]
        [InlineData("+12125551234", "US", true)]
        [InlineData("+4930123456", "AT", false)]
        [InlineData("030123456", "DE", false)]
        public void Fits(string value, string country, bool expected)
        {
            Assert.Equal(expected, PhoneCatalog.Fits(value, country));
        }

        /// <summary>
        /// Tests the readable form of a number.
        /// </summary>
        [Theory]
        [InlineData("+4930123456", "+49 30123456")]
        [InlineData("+1 242 555 1234", "+1 2425551234")]
        [InlineData("no number", null)]
        public void Format(string value, string expected)
        {
            Assert.Equal(expected, PhoneCatalog.Format(value));
        }

        /// <summary>
        /// Tests that every country with a numbering plan has a flag, and that a country without
        /// a telephone service has no calling code.
        /// </summary>
        [Fact]
        public void PlansFitTheCountryCatalog()
        {
            Assert.All(PhoneCatalog.Countries, x => Assert.True(CountryCatalog.IsKnown(x), x));
            Assert.Equal("49", PhoneCatalog.GetCallingCode("de"));
            Assert.Null(PhoneCatalog.GetCallingCode("AQ"));
        }
    }
}
