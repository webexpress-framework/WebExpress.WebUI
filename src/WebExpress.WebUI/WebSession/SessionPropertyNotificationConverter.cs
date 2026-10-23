using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using WebExpress.WebUI.WebNotification.Model;

namespace WebExpress.WebUI.WebSession
{
    /// <summary>
    /// Stores the notifications of a session as a list of records, so the session can move to
    /// another instance of a cluster. The dictionary holds notifications by interface, which the
    /// serializer could write but never read back.
    /// </summary>
    internal sealed class SessionPropertyNotificationConverter : JsonConverter<SessionPropertyNotification>
    {
        /// <summary>
        /// Reads the notifications.
        /// </summary>
        /// <param name="reader">The reader.</param>
        /// <param name="typeToConvert">The type to convert.</param>
        /// <param name="options">The serializer options.</param>
        /// <returns>The notifications of the session.</returns>
        public override SessionPropertyNotification Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var property = new SessionPropertyNotification();
            var records = JsonSerializer.Deserialize<List<NotificationRecord>>(ref reader) ?? [];

            foreach (var record in records.Where(x => x is not null))
            {
                property[record.Id] = record.ToNotification();
            }

            return property;
        }

        /// <summary>
        /// Writes the notifications.
        /// </summary>
        /// <param name="writer">The writer.</param>
        /// <param name="value">The notifications of the session.</param>
        /// <param name="options">The serializer options.</param>
        public override void Write(Utf8JsonWriter writer, SessionPropertyNotification value, JsonSerializerOptions options)
        {
            List<NotificationRecord> records;

            lock (value)
            {
                records = [.. value.Values.Where(x => x is not null).Select(x => NotificationRecord.From(x))];
            }

            JsonSerializer.Serialize(writer, records);
        }
    }
}
