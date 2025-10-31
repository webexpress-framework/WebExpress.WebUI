using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using WebExpress.WebCore.WebScope;

namespace WebExpress.WebUI.WebNotification
{
    /// <summary>
    /// Represents a notification with various properties such as id, heading, message, durability, icon, creation time, progress, and type.
    /// </summary>
    public interface INotification
    {
        /// <summary>
        /// Returns or sets the notification id.
        /// </summary>
        [JsonPropertyName("id")]
        Guid Id { get; }

        /// <summary>
        /// Returns or sets the heading.
        /// </summary>
        [JsonPropertyName("heading")]
        string Heading { get; set; }

        /// <summary>
        /// Returns or sets the notification message.
        /// </summary>
        [JsonPropertyName("message")]
        string Message { get; set; }

        /// <summary>
        /// Returns or sets the lifetime of the notification.
        /// </summary>
        [JsonPropertyName("durability")]
        int Durability { get; set; }

        /// <summary>
        /// Returns the icon. Can be null.
        /// </summary>
        [JsonPropertyName("icon")]
        string Icon { get; set; }

        /// <summary>
        /// Returns the creation time.
        /// </summary>
        [JsonPropertyName("created")]
        DateTime Created { get; }

        /// <summary>
        /// Progress as a percentage: 0–100%. Values less than 0 indicate no progress.
        /// </summary>
        [JsonPropertyName("progress")]
        int Progress { get; set; }

        /// <summary>
        /// Returns or sets the notification type.
        /// </summary>
        [JsonPropertyName("type"), JsonConverter(typeof(TypeNotificationConverter))]
        TypeNotification Type { get; set; }

        /// <summary>
        /// Returns or sets the scopes associated with the notification.
        /// </summary>
        [JsonIgnore]
        IEnumerable<IScope> Scops { get; }
    }
}
