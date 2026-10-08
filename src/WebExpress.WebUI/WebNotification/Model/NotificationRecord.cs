using System;
using System.Text.Json.Serialization;

namespace WebExpress.WebUI.WebNotification.Model
{
    /// <summary>
    /// The stored form of a notification. A notification has to cross process boundaries once
    /// several instances serve one application - in the session that moves between them and in
    /// the shared list of global notifications - and its own type cannot be read back, since
    /// its id and creation time are fixed at construction.
    /// </summary>
    internal sealed class NotificationRecord
    {
        /// <summary>
        /// Gets or sets the id of the application a global notification belongs to.
        /// </summary>
        [JsonPropertyName("application")]
        public string ApplicationId { get; set; }

        /// <summary>
        /// Gets or sets the notification id.
        /// </summary>
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        /// <summary>
        /// Gets or sets the headline.
        /// </summary>
        [JsonPropertyName("heading")]
        public string Heading { get; set; }

        /// <summary>
        /// Gets or sets the message.
        /// </summary>
        [JsonPropertyName("message")]
        public string Message { get; set; }

        /// <summary>
        /// Gets or sets the lifetime in milliseconds; negative for indefinite.
        /// </summary>
        [JsonPropertyName("durability")]
        public int Durability { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        [JsonPropertyName("icon")]
        public string Icon { get; set; }

        /// <summary>
        /// Gets or sets the address the notification is about.
        /// </summary>
        [JsonPropertyName("link")]
        public string Link { get; set; }

        /// <summary>
        /// Gets or sets the creation time, which the durability counts from.
        /// </summary>
        [JsonPropertyName("created")]
        public DateTime Created { get; set; }

        /// <summary>
        /// Gets or sets the progress.
        /// </summary>
        [JsonPropertyName("progress")]
        public int Progress { get; set; }

        /// <summary>
        /// Gets or sets the notification type.
        /// </summary>
        [JsonPropertyName("type")]
        public TypeNotification Type { get; set; }

        /// <summary>
        /// Captures a notification.
        /// </summary>
        /// <param name="notification">The notification.</param>
        /// <param name="applicationId">The application of a global notification, or null.</param>
        /// <returns>The record.</returns>
        internal static NotificationRecord From(INotification notification, string applicationId = null)
        {
            return new NotificationRecord
            {
                ApplicationId = applicationId,
                Id = notification.Id,
                Heading = notification.Heading,
                Message = notification.Message,
                Durability = notification.Durability,
                Icon = notification.Icon,
                Link = notification.Link,
                Created = notification.Created,
                Progress = notification.Progress,
                Type = notification.Type
            };
        }

        /// <summary>
        /// Recreates the notification, with its original id and creation time.
        /// </summary>
        /// <returns>The notification.</returns>
        internal Notification ToNotification()
        {
            return new Notification
            {
                Id = Id,
                Created = Created,
                Heading = Heading,
                Message = Message,
                Durability = Durability,
                Icon = Icon,
                Link = Link,
                Progress = Progress,
                Type = Type,
                Scops = []
            };
        }
    }
}
