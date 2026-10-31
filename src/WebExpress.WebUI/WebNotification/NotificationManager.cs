using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text.Json;
using WebExpress.WebCore;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebApplication;
using WebExpress.WebCore.WebCluster;
using WebExpress.WebCore.WebComponent;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebSession.Model;
using WebExpress.WebUI.WebNotification.Model;
using WebExpress.WebUI.WebSession;

namespace WebExpress.WebUI.WebNotification
{
    /// <summary>
    /// Manages notifications, including creation, destruction, and retrieval of notifications.
    /// </summary>
    /// <remarks>
    /// One session serves several requests at once - a page, its background calls and the
    /// message queue socket - so its notifications are only touched under a lock on the
    /// session property, the same lock the session serializer takes.
    /// </remarks>
    public sealed class NotificationManager : INotificationManager
    {
        private readonly IComponentHub _componentHub;
        private readonly NotificationDictionary _globalNotifications = new();

        /// <summary>
        /// The scope global notifications are kept under in the cluster store.
        /// </summary>
        internal const string StoreScope = "notification";

        // an indefinite notification still needs a bound in a shared store
        private static readonly TimeSpan IndefiniteLifetime = TimeSpan.FromDays(365);

        /// <summary>
        /// An event that fires when a notification is created.
        /// </summary>
        public event EventHandler<INotification> CreateNotification;

        /// <summary>
        /// An event that fires when a notification is created and carries
        /// the routing context (application, session) required to dispatch
        /// the notification through transport channels such as the
        /// WebSocket MessageQueue.
        /// </summary>
        public event EventHandler<NotificationDispatchEventArgs> DispatchNotification;

        /// <summary>
        /// An event that fires when a notification is destroyed.
        /// </summary>
        public event EventHandler<INotification> DestroyNotification;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="componentHub">The component hub.</param>
        /// <param name="httpServerContext">The reference to the context of the host.</param>
        [SuppressMessage("CodeQuality", "IDE0051:Remove unused private members", Justification = "Used via Reflection.")]
        private NotificationManager(IComponentHub componentHub, IHttpServerContext httpServerContext)
        {
            _componentHub = componentHub;

            httpServerContext?.Log?.Debug
            (
                I18N.Translate("webexpress.webui:notificationmanager.initialization")
            );
        }

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
        public INotification AddNotification(IApplicationContext applicationContext, string message, int durability = -1, string heading = null, string icon = null, TypeNotification type = TypeNotification.Light, string link = null)
        {
            var notification = new Notification()
            {
                Message = message,
                Durability = durability,
                Heading = heading,
                Icon = icon,
                Link = link,
                Type = type
            };

            AddGlobal(applicationContext, notification);
            OnCreateNotification(notification);
            OnDispatchNotification(notification, applicationContext, null);

            return notification;
        }

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
        public INotification AddNotification(IApplicationContext applicationContext, IRequest request, string message, int durability = -1, string heading = null, string icon = null, TypeNotification type = TypeNotification.Light, string link = null)
        {
            var notification = new Notification()
            {
                Message = I18N.Translate(request, message),
                Durability = durability,
                Heading = I18N.Translate(request, heading),
                Icon = icon,
                Link = link,
                Type = type
            };

            var notificationProperty = request.Session.GetOrCreateProperty<SessionPropertyNotification>();

            lock (notificationProperty)
            {
                notificationProperty.Add(notification.Id, notification);
            }

            OnCreateNotification(notification);
            OnDispatchNotification(notification, applicationContext, request.Session);

            return notification;
        }

        /// <summary>
        /// Returns the global notifications of the application together with the
        /// notifications of the session, dropping the expired ones.
        /// </summary>
        /// <param name="applicationContext">The application context.</param>
        /// <param name="request">The request.</param>
        /// <returns>An enumeration of the notifications.</returns>
        public IEnumerable<INotification> GetNotifications(IApplicationContext applicationContext, IRequest request)
        {
            var list = new List<INotification>(GetGlobal(applicationContext));

            // a websocket upgrade without a session cookie still deserves the global notifications
            if (request?.Session?.GetProperty<SessionPropertyNotification>() is { } notificationProperty)
            {
                var now = DateTime.UtcNow;

                lock (notificationProperty)
                {
                    foreach (var expired in notificationProperty.Values.Where(x => x.IsExpired(now)).ToList())
                    {
                        notificationProperty.Remove(expired.Id);
                    }

                    list.AddRange(notificationProperty.Values);
                }
            }

            return list;
        }

        /// <summary>
        /// Removes all global notifications of an application.
        /// </summary>
        /// <param name="applicationContext">The application context.</param>
        public void RemoveNotifications(IApplicationContext applicationContext)
        {
            foreach (var globalNotification in RemoveGlobal(applicationContext))
            {
                OnDestroyNotification(globalNotification);
            }
        }

        /// <summary>
        /// Removes all notifications of the session. The global notifications stay, since
        /// they belong to every user of the application and not to the one clearing theirs.
        /// </summary>
        /// <param name="request">The request.</param>
        public void RemoveNotifications(IRequest request)
        {
            if (request.Session.GetProperty<SessionPropertyNotification>() is not { } notificationProperty)
            {
                return;
            }

            List<INotification> removed;

            lock (notificationProperty)
            {
                removed = [.. notificationProperty.Values];
                notificationProperty.Clear();
            }

            foreach (var userNotification in removed)
            {
                OnDestroyNotification(userNotification);
            }
        }

        /// <summary>
        /// Removes a notification, whether it is a global one or one of the given session.
        /// A dismissal only knows the id, so both places have to be searched.
        /// </summary>
        /// <param name="id">The notification id.</param>
        /// <param name="session">The session the notification may belong to, or null to
        /// search the global notifications only.</param>
        public void RemoveNotifications(Guid id, Session session = null)
        {
            if ((RemoveGlobal(id) ?? RemoveFromSession(id, session)) is { } removed)
            {
                OnDestroyNotification(removed);
            }
        }

        /// <summary>
        /// Raises the CreateNotification event.
        /// </summary>
        /// <param name="notification">The notification.</param>
        private void OnCreateNotification(INotification notification)
        {
            CreateNotification?.Invoke(this, notification);
        }

        /// <summary>
        /// Raises the DispatchNotification event with the routing context
        /// required by downstream transports (e.g. the WebSocket popup
        /// bridge).
        /// </summary>
        private void OnDispatchNotification(INotification notification, IApplicationContext applicationContext, Session session)
        {
            DispatchNotification?.Invoke
            (
                this,
                new NotificationDispatchEventArgs(notification, applicationContext, session)
            );
        }

        /// <summary>
        /// Raises the DestroyNotification event.
        /// </summary>
        /// <param name="notification">The notification.</param>
        private void OnDestroyNotification(INotification notification)
        {
            DestroyNotification?.Invoke(this, notification);
        }

        /// <summary>
        /// Returns the cluster store when other instances share it. Global notifications are
        /// then kept there, since a notification raised on one instance must show on the pages
        /// every other instance renders.
        /// </summary>
        private IClusterStore SharedStore => _componentHub?.ClusterManager?.Store is { IsShared: true } store ? store : null;

        /// <summary>
        /// Adds a global notification.
        /// </summary>
        /// <param name="applicationContext">The application the notification belongs to.</param>
        /// <param name="notification">The notification.</param>
        private void AddGlobal(IApplicationContext applicationContext, INotification notification)
        {
            if (SharedStore is { } store)
            {
                var lifetime = notification.Durability >= 0 ? TimeSpan.FromMilliseconds(notification.Durability) : IndefiniteLifetime;
                var record = NotificationRecord.From(notification, applicationContext?.ApplicationId);

                store.Set(StoreScope, notification.Id.ToString(), JsonSerializer.SerializeToUtf8Bytes(record), lifetime);

                return;
            }

            lock (_globalNotifications)
            {
                _globalNotifications.AddNotificationItem(applicationContext, notification);
            }
        }

        /// <summary>
        /// Returns the live global notifications of an application, dropping the expired ones.
        /// </summary>
        /// <param name="applicationContext">The application.</param>
        /// <returns>The notifications.</returns>
        private IEnumerable<INotification> GetGlobal(IApplicationContext applicationContext)
        {
            if (SharedStore is { } store)
            {
                // the store expires notifications with a durability on its own
                return ReadShared(store)
                    .Where(x => string.Equals(x.ApplicationId, applicationContext?.ApplicationId, StringComparison.OrdinalIgnoreCase))
                    .Select(x => x.ToNotification())
                    .ToList();
            }

            var now = DateTime.UtcNow;

            lock (_globalNotifications)
            {
                foreach (var expired in _globalNotifications.GetNotifications(applicationContext).Where(x => x.IsExpired(now)).ToList())
                {
                    _globalNotifications.RemoveNotification(expired.Id);
                }

                return _globalNotifications.GetNotifications(applicationContext).ToList();
            }
        }

        /// <summary>
        /// Removes every global notification of an application.
        /// </summary>
        /// <param name="applicationContext">The application.</param>
        /// <returns>The removed notifications.</returns>
        private IEnumerable<INotification> RemoveGlobal(IApplicationContext applicationContext)
        {
            if (SharedStore is { } store)
            {
                var removed = ReadShared(store)
                    .Where(x => string.Equals(x.ApplicationId, applicationContext?.ApplicationId, StringComparison.OrdinalIgnoreCase))
                    .ToList();

                removed.ForEach(x => store.Remove(StoreScope, x.Id.ToString()));

                return removed.Select(x => x.ToNotification()).ToList();
            }

            lock (_globalNotifications)
            {
                return _globalNotifications.RemoveNotifications(applicationContext).ToList();
            }
        }

        /// <summary>
        /// Removes a global notification.
        /// </summary>
        /// <param name="id">The notification id.</param>
        /// <returns>The removed notification, or null if there is no global one with the id.</returns>
        private INotification RemoveGlobal(Guid id)
        {
            if (SharedStore is { } store)
            {
                var key = id.ToString();

                // only the instance whose remove succeeds reports it, so a dismissal raced on
                // two instances is destroyed once
                return store.Get(StoreScope, key) is { } stored && store.Remove(StoreScope, key)
                    ? ReadRecord(stored)?.ToNotification()
                    : null;
            }

            lock (_globalNotifications)
            {
                return _globalNotifications.RemoveNotification(id);
            }
        }

        /// <summary>
        /// Removes a notification from a session.
        /// </summary>
        /// <param name="id">The notification id.</param>
        /// <param name="session">The session, or null.</param>
        /// <returns>The removed notification, or null if the session does not hold it.</returns>
        private INotification RemoveFromSession(Guid id, Session session)
        {
            // a socket keeps its handshake snapshot while later requests add notifications
            if (session is not null && SharedStore is not null)
            {
                session = _componentHub.SessionManager.FindSession(session.Id);
            }

            if (session?.GetProperty<SessionPropertyNotification>() is not { } notificationProperty)
            {
                return null;
            }

            INotification removed;

            lock (notificationProperty)
            {
                if (!notificationProperty.Remove(id, out removed))
                {
                    return null;
                }
            }

            // a dismissal arrives over the message queue socket, where no end of a request
            // writes the session back to the cluster store
            _componentHub?.SessionManager?.Commit(session);

            return removed;
        }

        /// <summary>
        /// Reads the global notifications of every application from the cluster store.
        /// </summary>
        /// <param name="store">The cluster store.</param>
        /// <returns>The stored records.</returns>
        private static IEnumerable<NotificationRecord> ReadShared(IClusterStore store)
        {
            foreach (var item in store.List(StoreScope))
            {
                if (ReadRecord(item.Value) is { } record)
                {
                    yield return record;
                }
            }
        }

        /// <summary>
        /// Reads a stored notification. An unreadable entry is skipped rather than failing
        /// the page, since another instance may run a version that stores it differently.
        /// </summary>
        /// <param name="value">The stored bytes.</param>
        /// <returns>The record, or null if it cannot be read.</returns>
        private static NotificationRecord ReadRecord(byte[] value)
        {
            try
            {
                return JsonSerializer.Deserialize<NotificationRecord>(value);
            }
            catch (JsonException)
            {
                return null;
            }
        }

        /// <summary>
        /// Disposes the resources used by the NotificationManager.
        /// </summary>
        public void Dispose()
        {
        }
    }
}
