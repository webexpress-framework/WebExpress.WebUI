using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using WebExpress.WebCore.WebScope;

namespace WebExpress.WebUI.WebNotification.Model
{
    /// <summary>
    /// Represents a notification with various properties such as id, heading, message, durability, icon, creation time, progress, and type.
    /// </summary>
    public class Notification : INotification
    {
        /// <summary>
        /// Gets or sets the notification id.
        /// </summary>
        [JsonPropertyName("id")]
        public Guid Id { get; } = Guid.NewGuid();

        /// <summary>
        /// Gets or sets the heading.
        /// </summary>
        [JsonPropertyName("heading")]
        public string Heading { get; set; }

        /// <summary>
        /// Gets or sets the notification message.
        /// </summary>
        [JsonPropertyName("message")]
        public string Message { get; set; }

        /// <summary>
        /// Gets or sets the lifetime of the notification.
        /// </summary>
        [JsonPropertyName("durability")]
        public int Durability { get; set; }

        /// <summary>
        /// Returns the icon. Can be null.
        /// </summary>
        [JsonPropertyName("icon")]
        public string Icon { get; set; }

        /// <summary>
        /// Returns the creation time.
        /// </summary>
        [JsonPropertyName("created")]
        public DateTime Created { get; } = DateTime.Now;

        /// <summary>
        /// Progress as a percentage: 0–100%. Values less than 0 indicate no progress.
        /// </summary>
        [JsonPropertyName("progress")]
        public int Progress { get; set; } = -1;

        /// <summary>
        /// Gets or sets the notification type.
        /// </summary>
        [JsonPropertyName("type"), JsonConverter(typeof(TypeNotificationConverter))]
        public TypeNotification Type { get; set; }

        /// <summary>
        /// Gets or sets the scopes associated with the notification.
        /// </summary>
        [JsonIgnore]
        public IEnumerable<IScope> Scops { get; set; }

        /// <summary>
        /// Constructor
        /// </summary>
        public Notification()
        {
        }
    }
}
