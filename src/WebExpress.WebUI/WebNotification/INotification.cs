using System;
using System.Text.Json.Serialization;

namespace WebExpress.WebUI.WebNotification
{
    /// <summary>
    /// Represents a notification with various properties such as id, heading, message, durability, icon, creation time, progress, and type.
    /// </summary>
    public interface INotification
    {
        /// <summary>
        /// Gets or sets the notification id.
        /// </summary>
        [JsonPropertyName("id")]
        Guid Id { get; }

        /// <summary>
        /// Gets or sets the heading.
        /// </summary>
        [JsonPropertyName("heading")]
        string Heading { get; set; }

        /// <summary>
        /// Gets or sets the notification message.
        /// </summary>
        [JsonPropertyName("message")]
        string Message { get; set; }

        /// <summary>
        /// Gets or sets the lifetime of the notification.
        /// </summary>
        [JsonPropertyName("durability")]
        int Durability { get; set; }

        /// <summary>
        /// Returns the icon. Can be null.
        /// </summary>
        [JsonPropertyName("icon")]
        string Icon { get; set; }

        /// <summary>
        /// Returns the address the notification is about, so the reader can go to the thing
        /// that changed instead of having to find it. Can be null, for a notification that
        /// reports something without a page of its own.
        /// </summary>
        [JsonPropertyName("link")]
        string Link { get; set; }

        /// <summary>
        /// Returns the creation time in utc.
        /// </summary>
        [JsonPropertyName("created")]
        DateTime Created { get; }

        /// <summary>
        /// Progress as a percentage: 0–100%. Values less than 0 indicate no progress.
        /// </summary>
        [JsonPropertyName("progress")]
        int Progress { get; set; }

        /// <summary>
        /// Gets or sets the notification type.
        /// </summary>
        [JsonPropertyName("type"), JsonConverter(typeof(TypeNotificationConverter))]
        TypeNotification Type { get; set; }

        /// <summary>
        /// Determines whether the notification has outlived its durability. The creation time
        /// is compared in utc, since a notification created on one instance of a cluster may
        /// be read on another one in a different time zone, and a local clock jumps at the
        /// daylight saving change.
        /// </summary>
        /// <param name="utcNow">The current time in utc.</param>
        /// <returns>True if the notification has a durability and it has passed.</returns>
        bool IsExpired(DateTime utcNow)
        {
            return Durability >= 0 && Created.ToUniversalTime().AddMilliseconds(Durability) < utcNow;
        }
    }
}
