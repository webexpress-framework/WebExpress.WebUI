using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using WebExpress.WebCore;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebApplication;
using WebExpress.WebCore.WebComponent;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebScope;
using WebExpress.WebUI.WebNotification.Model;
using WebExpress.WebUI.WebSession;

namespace WebExpress.WebUI.WebNotification
{
    /// <summary>
    /// Manages notifications, including creation, destruction, and retrieval of notifications.
    /// </summary>
    public sealed class NotificationManager : INotificationManager
    {
        private readonly IComponentHub _componentHub;
        private readonly IHttpServerContext _httpServerContext;
        private readonly NotificationDictionary _globalNotifications = new();

        /// <summary>
        /// An event that fires when an notification is created.
        /// </summary>
        public event EventHandler<INotification> CreateNotification;

        /// <summary>
        /// An event that fires when an notification is destroyed.
        /// </summary>
        public event EventHandler<INotification> DestroyNotification;

        /// <summary>
        /// Gets the reference to the context of the host.
        /// </summary>
        public IHttpServerContext HttpServerContext { get; private set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="componentHub">The component hub.</param>
        /// <param name="httpServerContext">The reference to the context of the host.</param>
        [SuppressMessage("CodeQuality", "IDE0051:Remove unused private members", Justification = "Used via Reflection.")]
        private NotificationManager(IComponentHub componentHub, IHttpServerContext httpServerContext)
        {
            _componentHub = componentHub;
            _httpServerContext = httpServerContext;

            _httpServerContext.Log.Debug
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
        /// <param name="scops">The scopes for the notification.</param>
        /// <returns>The created notification.</returns>
        public INotification AddNotification(IApplicationContext applicationContext, string message, int durability = -1, string heading = null, string icon = null, TypeNotification type = TypeNotification.Light, IEnumerable<IScope> scops = null)
        {
            var notification = new Notification()
            {
                Message = message,
                Durability = durability,
                Heading = heading,
                Icon = icon,
                Type = type,
                Scops = scops ?? []
            };

            _globalNotifications.AddNotificationItem(applicationContext, notification);
            OnCreateNotification(notification);

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
        /// <param name="scops">The scopes for the notification.</param>
        /// <returns>The created notification.</returns>
        public INotification AddNotification(IApplicationContext applicationContext, Request request, string message, int durability = -1, string heading = null, string icon = null, TypeNotification type = TypeNotification.Light, IEnumerable<IScope> scops = null)
        {
            var notification = new Notification()
            {
                Message = I18N.Translate(request, message),
                Durability = durability,
                Heading = I18N.Translate(request, heading),
                Icon = icon?.ToString(),
                Type = type,
                Scops = scops ?? []
            };

            // user notification
            if (!request.Session.Properties.ContainsKey(typeof(SessionPropertyNotification)))
            {
                request.Session.Properties.Add(typeof(SessionPropertyNotification), new SessionPropertyNotification());
            }

            var notificationProperty = request.Session.Properties[typeof(SessionPropertyNotification)] as SessionPropertyNotification;

            if (!notificationProperty.ContainsKey(notification.Id))
            {
                lock (notificationProperty)
                {
                    notificationProperty.Add(notification.Id, notification);
                }
            }

            OnCreateNotification(notification);

            return notification;
        }

        /// <summary>
        /// Returns all notifications from the session.
        /// </summary>
        /// <param name="applicationContext">The application context.</param>
        /// <param name="request">The request.</param>
        /// <returns>An enumeration of the notifications.</returns>
        public IEnumerable<INotification> GetNotifications(IApplicationContext applicationContext, Request request)
        {
            var list = new List<INotification>();

            var scrapGlobal = _globalNotifications.GetNotifications(applicationContext).Where(x => x.Durability >= 0 && x.Created.AddMilliseconds(x.Durability) < DateTime.Now).ToList();
            lock (_globalNotifications)
            {
                // remove expired notifications
                scrapGlobal.ForEach(x => _globalNotifications.RemoveNotification(x.Id));
            }

            list.AddRange(_globalNotifications.GetNotifications(applicationContext));

            if (request.Session.Properties.ContainsKey(typeof(SessionPropertyNotification)) &&
                request.Session.Properties[typeof(SessionPropertyNotification)] is SessionPropertyNotification notificationProperty)
            {
                var scrap = notificationProperty.Values.Where(x => x.Durability >= 0 && x.Created.AddMilliseconds(x.Durability) < DateTime.Now).ToList();

                lock (notificationProperty)
                {
                    // remove expired notifications
                    scrap.ForEach(x => notificationProperty.Remove(x.Id));
                }


                list.AddRange(notificationProperty.Values);
            }

            return list;
        }

        /// <summary>
        /// Removes all notifications from the session.
        /// </summary>
        /// <param name="applicationContext">The application context.</param>
        public void RemoveNotifications(IApplicationContext applicationContext)
        {
            foreach (var globalNotification in _globalNotifications.RemoveNotifications(applicationContext))
            {
                OnDestroyNotification(globalNotification);
            }
        }

        /// <summary>
        /// Removes all notifications from the session.
        /// </summary>
        /// <param name="applicationContext">The application context.</param>
        /// <param name="request">The request.</param>
        public void RemoveNotifications(IApplicationContext applicationContext, Request request)
        {
            foreach (var globalNotification in _globalNotifications.RemoveNotifications(applicationContext))
            {
                OnDestroyNotification(globalNotification);
            }

            if (request.Session.Properties.ContainsKey(typeof(SessionPropertyNotification)) &&
                request.Session.Properties[typeof(SessionPropertyNotification)] is SessionPropertyNotification notificationProperty)
            {
                foreach (var userNotification in notificationProperty.Values.ToList())
                {
                    OnDestroyNotification(userNotification);

                    notificationProperty.Remove(userNotification.Id);
                }
            }
        }

        /// <summary>
        /// Remove a notification.
        /// </summary>
        /// <param name="id">The notification id.</param>
        public void RemoveNotifications(Guid id)
        {
            _globalNotifications.RemoveNotification(id);
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
        /// Raises the DestroyNotification event.
        /// </summary>
        /// <param name="notification">The notification.</param>
        private void OnDestroyNotification(INotification notification)
        {
            DestroyNotification?.Invoke(this, notification);
        }

        // <summary>
        // Disposes the resources used by the NotificationManager.
        // </summary>
        public void Dispose()
        {
            GC.SuppressFinalize(this);
        }
    }
}
