using System;
using System.Collections.Generic;
using WebExpress.WebCore.WebApplication;
using WebExpress.WebCore.WebComponent;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebScope;

namespace WebExpress.WebUI.WebNotification
{
    /// <summary>
    /// Interface for managing web fragments.
    /// </summary>
    public interface INotificationManager : IComponentManager
    {
        /// <summary>
        /// An event that fires when an notification is created.
        /// </summary>
        event EventHandler<INotification> CreateNotification;

        /// <summary>
        /// An event that fires when an notification is destroyed.
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
        /// <param name="scops">The scopes for the notification.</param>
        /// <returns>The created notification.</returns>
        INotification AddNotification(IApplicationContext applicationContext, string message, int durability = -1, string heading = null, string icon = null, TypeNotification type = TypeNotification.Light, IEnumerable<IScope> scops = null, string link = null);

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
        /// <param name="scops">The scopes for the notification.</param>
        /// <returns>The created notification.</returns>
        INotification AddNotification(IApplicationContext applicationContext, Request request, string message, int durability = -1, string heading = null, string icon = null, TypeNotification type = TypeNotification.Light, IEnumerable<IScope> scops = null, string link = null);

        /// <summary>
        /// Returns all notifications from the session.
        /// </summary>
        /// <param name="applicationContext">The application context.</param>
        /// <param name="request">The request.</param>
        /// <returns>An enumeration of the notifications.</returns>
        IEnumerable<INotification> GetNotifications(IApplicationContext applicationContext, Request request);

        /// <summary>
        /// Removes all notifications from the session.
        /// </summary>
        /// <param name="applicationContext">The application context.</param>
        /// <param name="request">The request.</param>
        void RemoveNotifications(IApplicationContext applicationContext);

        /// <summary>
        /// Removes all notifications from the session.
        /// </summary>
        /// <param name="applicationContext">The application context.</param>
        /// <param name="request">The request.</param>
        void RemoveNotifications(IApplicationContext applicationContext, Request request);

        /// <summary>
        /// Remove a notification.
        /// </summary>
        /// <param name="id">The notification id.</param>
        void RemoveNotifications(Guid id);
    }
}
