using System;
using System.Collections.Generic;
using WebExpress.WebCore.WebApplication;
using WebExpress.WebCore.WebComponent;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebSession.Model;

namespace WebExpress.WebUI.WebNotification
{
    /// <summary>
    /// Interface for managing notifications, either global ones that every user of an
    /// application sees or ones kept in the session of a single user.
    /// </summary>
    public interface INotificationManager : IComponentManager
    {
        /// <summary>
        /// An event that fires when a notification is created.
        /// </summary>
        event EventHandler<INotification> CreateNotification;

        /// <summary>
        /// An event that fires when a notification is created and carries the routing context
        /// (application, session) a transport such as the message queue needs to deliver it.
        /// </summary>
        event EventHandler<NotificationDispatchEventArgs> DispatchNotification;

        /// <summary>
        /// An event that fires when a notification is destroyed.
        /// </summary>
        event EventHandler<INotification> DestroyNotification;

        /// <summary>
        /// Creates a new global notification.
        /// </summary>
        /// <param name="applicationContext">The application context.</param>
        /// <param name="message">The notification message.</param>
        /// <param name="durability">The lifetime of the notification. -1 for indefinite validity.</param>
        /// <param name="heading">The headline.</param>
        /// <param name="icon">An icon.</param>
        /// <param name="type">The notification type.</param>
        /// <param name="link">The address the notification is about, so the reader can go
        /// there instead of having to find it. Null for a notification without a page.</param>
        /// <returns>The created notification.</returns>
        INotification AddNotification(IApplicationContext applicationContext, string message, int durability = -1, string heading = null, string icon = null, TypeNotification type = TypeNotification.Light, string link = null);

        /// <summary>
        /// Creates a new notification in the session.
        /// </summary>
        /// <param name="applicationContext">The application context.</param>
        /// <param name="request">The request.</param>
        /// <param name="message">The notification message.</param>
        /// <param name="durability">The lifetime of the notification. -1 for indefinite validity.</param>
        /// <param name="heading">The headline.</param>
        /// <param name="icon">An icon.</param>
        /// <param name="type">The notification type.</param>
        /// <param name="link">The address the notification is about, so the reader can go
        /// there instead of having to find it. Null for a notification without a page.</param>
        /// <returns>The created notification.</returns>
        INotification AddNotification(IApplicationContext applicationContext, Request request, string message, int durability = -1, string heading = null, string icon = null, TypeNotification type = TypeNotification.Light, string link = null);

        /// <summary>
        /// Returns the global notifications of the application together with the
        /// notifications of the session.
        /// </summary>
        /// <param name="applicationContext">The application context.</param>
        /// <param name="request">The request.</param>
        /// <returns>An enumeration of the notifications.</returns>
        IEnumerable<INotification> GetNotifications(IApplicationContext applicationContext, Request request);

        /// <summary>
        /// Removes all global notifications of an application.
        /// </summary>
        /// <param name="applicationContext">The application context.</param>
        void RemoveNotifications(IApplicationContext applicationContext);

        /// <summary>
        /// Removes all notifications of the session. The global notifications stay, since
        /// they belong to every user of the application.
        /// </summary>
        /// <param name="request">The request.</param>
        void RemoveNotifications(Request request);

        /// <summary>
        /// Removes a notification, whether it is a global one or one of the given session.
        /// </summary>
        /// <param name="id">The notification id.</param>
        /// <param name="session">The session the notification may belong to, or null to
        /// search the global notifications only.</param>
        void RemoveNotifications(Guid id, Session session = null);
    }
}
