using System.Text.Json;
using WebExpress.WebUI.WebNotification;

namespace WebExpress.WebUI.Test.WebNotification
{
    /// <summary>
    /// Tests the json converter of the notification type.
    /// </summary>
    public class UnitTestTypeNotificationConverter
    {
        private static readonly JsonSerializerOptions _options = new()
        {
            Converters = { new TypeNotificationConverter() }
        };

        /// <summary>
        /// Tests that every notification type survives a write and a read, since the written
        /// css class is what a persisted or relayed notification brings back.
        /// </summary>
        [Theory]
        [InlineData(TypeNotification.Default)]
        [InlineData(TypeNotification.Primary)]
        [InlineData(TypeNotification.Secondary)]
        [InlineData(TypeNotification.Success)]
        [InlineData(TypeNotification.Info)]
        [InlineData(TypeNotification.Warning)]
        [InlineData(TypeNotification.Danger)]
        [InlineData(TypeNotification.Dark)]
        [InlineData(TypeNotification.Light)]
        [InlineData(TypeNotification.White)]
        [InlineData(TypeNotification.Transparent)]
        public void RoundTrip(TypeNotification type)
        {
            // act
            var json = JsonSerializer.Serialize(type, _options);
            var read = JsonSerializer.Deserialize<TypeNotification>(json, _options);

            // validation
            Assert.Equal(type, read);
        }

        /// <summary>
        /// Tests that a hand-written payload may name the type instead of its css class.
        /// </summary>
        [Theory]
        [InlineData("\"success\"", TypeNotification.Success)]
        [InlineData("\"Danger\"", TypeNotification.Danger)]
        [InlineData("\"alert-warning\"", TypeNotification.Warning)]
        [InlineData("\"\"", TypeNotification.Default)]
        public void Read(string json, TypeNotification expected)
        {
            // act
            var read = JsonSerializer.Deserialize<TypeNotification>(json, _options);

            // validation
            Assert.Equal(expected, read);
        }

        /// <summary>
        /// Tests that an unknown type is rejected instead of silently falling back to the default.
        /// </summary>
        [Theory]
        [InlineData("\"alert-unknown\"")]
        [InlineData("\"42\"")]
        public void ReadUnknown(string json)
        {
            Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<TypeNotification>(json, _options));
        }
    }
}
