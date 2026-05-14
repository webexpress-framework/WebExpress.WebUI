using System;
using WebExpress.WebCore.WebApplication;
using WebExpress.WebCore.WebSession.Model;

namespace WebExpress.WebUI.WebNotification
{
    /// <summary>
    /// Carries the routing context for a freshly created notification so
    /// downstream dispatchers (e.g. the popup WebSocket bridge) can pick the
    /// correct delivery target without having to introspect the notification
    /// stores themselves.
    /// </summary>
    public sealed class NotificationDispatchEventArgs : EventArgs
    {
        /// <summary>
        /// Gets the notification that was created.
        /// </summary>
        public INotification Notification { get; }

        /// <summary>
        /// Gets the application context the notification belongs to.
        /// </summary>
        public IApplicationContext ApplicationContext { get; }

        /// <summary>
        /// Gets the session the notification is scoped to. <c>null</c> when
        /// the notification was added globally (visible to every client of
        /// the application).
        /// </summary>
        public Session Session { get; }

        /// <summary>
        /// Initializes a new instance.
        /// </summary>
        /// <param name="notification">The notification.</param>
        /// <param name="applicationContext">The owning application.</param>
        /// <param name="session">
        /// The owning session, or <c>null</c> for global notifications.
        /// </param>
        public NotificationDispatchEventArgs
        (
            INotification notification,
            IApplicationContext applicationContext,
            Session session = null
        )
        {
            Notification = notification;
            ApplicationContext = applicationContext;
            Session = session;
        }
    }
}
