using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace WebExpress.WebUI.WebNotification
{
    /// <summary>
    /// Conversion of notification type from and to json.
    /// </summary>
    public class TypeNotificationConverter : JsonConverter<TypeNotification>
    {
        /// <summary>
        /// Read and convert json to TypeNotification.
        /// </summary>
        /// <param name="reader">The reader.</param>
        /// <param name="typeToConvert">The type.</param>
        /// <param name="options">The options.</param>
        /// <returns></returns>
        public override TypeNotification Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString();

            if (string.IsNullOrWhiteSpace(value))
            {
                return TypeNotification.Default;
            }

            // write emits the css class, so that is what a round trip brings back; the enum
            // name is still accepted for payloads written by hand
            foreach (var type in Enum.GetValues<TypeNotification>())
            {
                if (string.Equals(type.ToClass(), value, StringComparison.OrdinalIgnoreCase))
                {
                    return type;
                }
            }

            if (Enum.TryParse<TypeNotification>(value, true, out var named) && Enum.IsDefined(named))
            {
                return named;
            }

            throw new JsonException($"'{value}' is not a known notification type.");
        }

        /// <summary>
        /// Writes the value as json.
        /// </summary>
        /// <param name="writer">Der writer.</param>
        /// <param name="type">The value.</param>
        /// <param name="options">The options.</param>
        public override void Write(Utf8JsonWriter writer, TypeNotification type, JsonSerializerOptions options)
        {
            writer.WriteStringValue(type.ToClass());
        }
    }
}
